#!/usr/bin/env python
"""Carry the Vitec finance charge data over to Artio Finance Charges ([ART_FC]), in one Vitec account.

Run it AFTER ArtioFinanceChargesSDF is deployed (its fields must exist) and BEFORE any [ART_FC] run and
before the Vitec objects are deleted - deleting a custom field deletes its values.

What is carried over (Vitec field -> [ART_FC] field):
  1. charged        invoice with custbody_tvz_2575_art_fin_chrg
                    -> custbody_art_fc_evaluated = T, custbody_art_fc_fc_invoice = that link, note
                    Without this, the first [ART_FC] run would charge these invoices a second time.
  2. skipped        custbody_tvz_2575_art_excld_fc = T with a failure reason (Vitec marks processed invoices
                    "excluded" too) -> custbody_art_fc_evaluated = T, the reason copied to the note
  3. fc invoices    finance charge invoices Vitec created (memo 'FFC invoice') -> custbody_art_fc_is_fc = T
  4. manual excl.   custbody_tvz_2575_art_excld_fc = T with no reason, no link, not a finance charge
                    -> custbody_art_fc_excluded = T (a user's own exclusion)
  5. customers      custentity_tvz_2575_art_excld_fc = T -> custentity_art_fc_excluded = T

Every selection filters on the [ART_FC] field it writes, so a re-run only finds what is still left: the
migration is idempotent and safe to interrupt.

    cd C:/Projects/VitecFinanceChargesSDF
    python tools/migrate_to_artio_fc.py --env SBOX                                        # dry run: counts only
    python tools/migrate_to_artio_fc.py --env SBOX --apply --confirm-account 9572970_SB2
    python tools/migrate_to_artio_fc.py --env PROD --apply --confirm-account 9572970 --allow-production

Writes go through the REST record API, so they fire the account's invoice User Events and are subject to
closed-period locks. Failures are counted, written to tools/migration_failures_<step>.json and reported;
they never stop the other records.
"""
import argparse
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.expanduser('~/.claude/skills/netsuite-client'))
from nsclient.config import build_client, render_banner  # noqa: E402
from nsclient.bulk_ops import bulk_update_varied  # noqa: E402

NOTE_MAX = 3900
PREFIX = 'Migrated from Vitec finance charges: '


def not_set(field):
    return f"NVL({field}, 'F') = 'F'"


def steps(target_fields_exist):
    """(name, record type, SQL, values builder). Without the [ART_FC] fields (dry run before the deploy) the
    shrinking filters are left out, so the counts show everything that would be carried over."""
    f = (lambda cond: f' AND {cond}') if target_fields_exist else (lambda cond: '')
    return [
        ('charged', 'invoice',
         "SELECT t.id, t.custbody_tvz_2575_art_fin_chrg AS fc, BUILTIN.DF(t.custbody_tvz_2575_art_fin_chrg) AS fcname "
         "FROM transaction t WHERE t.type = 'CustInvc' AND t.custbody_tvz_2575_art_fin_chrg IS NOT NULL"
         + f(not_set('t.custbody_art_fc_evaluated')) + " ORDER BY t.id",
         lambda r: {'custbody_art_fc_evaluated': True, 'custbody_art_fc_fc_invoice': {'id': str(r['fc'])},
                    'custbody_art_fc_note': f"{PREFIX}charged on {r.get('fcname') or r['fc']}"}),
        ('skipped', 'invoice',
         "SELECT t.id, t.custbody_tvz_2575_art_ffc_failed_rsn AS reason FROM transaction t "
         "WHERE t.type = 'CustInvc' AND t.custbody_tvz_2575_art_excld_fc = 'T' "
         "AND t.custbody_tvz_2575_art_fin_chrg IS NULL AND t.custbody_tvz_2575_art_ffc_failed_rsn IS NOT NULL"
         + f(not_set('t.custbody_art_fc_evaluated')) + " ORDER BY t.id",
         lambda r: {'custbody_art_fc_evaluated': True,
                    'custbody_art_fc_note': (PREFIX + str(r.get('reason') or ''))[:NOTE_MAX]}),
        ('fc_invoices', 'invoice',
         "SELECT t.id FROM transaction t WHERE t.type = 'CustInvc' AND t.memo = 'FFC invoice'"
         + f(not_set('t.custbody_art_fc_is_fc')) + " ORDER BY t.id",
         lambda r: {'custbody_art_fc_is_fc': True}),
        ('manual_exclusions', 'invoice',
         "SELECT t.id FROM transaction t WHERE t.type = 'CustInvc' AND t.custbody_tvz_2575_art_excld_fc = 'T' "
         "AND t.custbody_tvz_2575_art_fin_chrg IS NULL AND t.custbody_tvz_2575_art_ffc_failed_rsn IS NULL "
         "AND NVL(t.memo, ' ') <> 'FFC invoice'"
         + f(not_set('t.custbody_art_fc_excluded')) + " ORDER BY t.id",
         lambda r: {'custbody_art_fc_excluded': True}),
        ('customers', 'customer',
         "SELECT c.id FROM customer c WHERE c.custentity_tvz_2575_art_excld_fc = 'T'"
         + f(not_set('c.custentity_art_fc_excluded')) + " ORDER BY c.id",
         lambda r: {'custentity_art_fc_excluded': True}),
    ]


def target_fields_exist(client):
    """Looked up in the customfield table: selecting an unknown field can answer with a bare 500, not a clean error."""
    rows = client.suiteql("SELECT scriptid FROM customfield WHERE UPPER(scriptid) IN "
                          "('CUSTBODY_ART_FC_EVALUATED', 'CUSTBODY_ART_FC_IS_FC', 'CUSTBODY_ART_FC_EXCLUDED', "
                          "'CUSTBODY_ART_FC_FC_INVOICE', 'CUSTBODY_ART_FC_NOTE', 'CUSTENTITY_ART_FC_EXCLUDED')")
    return len(rows) == 6


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('--env', required=True, help='SBOX or PROD, from NS_CL_Config.JSON')
    p.add_argument('--apply', action='store_true', help='Write. Without it: dry run, counts only')
    p.add_argument('--confirm-account', help='Required with --apply: must equal the resolved account id')
    p.add_argument('--allow-production', action='store_true', help='Required with --apply on a production account')
    p.add_argument('--concurrency', type=int, default=5)
    args = p.parse_args()

    if args.apply and not args.confirm_account:
        sys.stderr.write('REFUSING: --apply needs --confirm-account <account id>.\n')
        return 3

    root = Path(__file__).resolve().parent.parent
    client, spec, company = build_client(root, args.env)
    sys.stderr.write(render_banner(spec, company) + '\n')

    exists = target_fields_exist(client)
    if not exists:
        sys.stderr.write('[ART_FC] fields not found in this account: ArtioFinanceChargesSDF is not deployed yet.\n')
        if args.apply:
            sys.stderr.write('REFUSING to write: deploy ArtioFinanceChargesSDF first.\n')
            return 3
        sys.stderr.write('Dry run shows everything that would be carried over.\n')

    plan = []
    for name, rtype, sql, build in steps(exists):
        rows = client.suiteql(sql)
        plan.append((name, rtype, [{'id': str(r['id']), 'values': build(r)} for r in rows]))
        print(f'{name:<18} {rtype:<9} {len(rows):>6} to carry over')

    if not args.apply:
        sample = next((items[0] for _, _, items in plan if items), None)
        if sample:
            print('\nsample update:', json.dumps(sample, ensure_ascii=False))
        print('\nDry run - nothing written.')
        return 0

    failed_total = 0
    for name, rtype, items in plan:
        if not items:
            continue
        result = bulk_update_varied(
            client, rtype, items, confirm_account=args.confirm_account, concurrency=args.concurrency,
            allow_production=args.allow_production,
            log_failures_path=str(root / 'tools' / f'migration_failures_{name}.json'))
        print(f'{name}: {result.summary()}')
        failed_total += 0 if result.ok else 1

    print('\nRecount after the migration (what is still left):')
    for name, rtype, sql, _ in steps(True):
        print(f'{name:<18} {len(client.suiteql(sql)):>6} left')
    return 0 if failed_total == 0 else 5


if __name__ == '__main__':
    sys.exit(main())
