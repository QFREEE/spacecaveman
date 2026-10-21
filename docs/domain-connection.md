# Domain connection

## Configuration

- Registrar: Squarespace Domains II LLC; no registrar transfer.
- DNS provider: Cloudflare Free.
- Domain: `spacecaveman.com`.
- Authoritative nameservers: `marty.ns.cloudflare.com` and `sierra.ns.cloudflare.com`.
- Worker: `spacecaveman`, production deployment.
- Fallback: `https://spacecaveman.spacecaveman.workers.dev`.
- Root domain uses Workers Custom Domains, not a CNAME pointing at workers.dev.
- The custom-domain declaration is recorded in `wrangler.jsonc` for future deployments.

## Cutover performed on 2026-10-20 (America/New_York)

The owner changed the nameservers in their own Squarespace browser session and removed the old DNSSEC delegation. Cloudflare reports the zone active, and both assigned authoritative nameservers return Cloudflare addresses for the root domain.

The preserved legacy root A record (`199.36.158.100`) was removed from Cloudflare because it conflicted with Worker Custom Domains. Cloudflare created a proxied root record for the Worker. The `_domainconnect` CNAME was preserved. Public checks found no root MX or TXT records; a public scan is not a full inventory of all possible subdomains. The owner reported deleting the old records at Squarespace.

The domain was attached using the Cloudflare API to the existing deployed Worker. In-progress local presence changes were not deployed by this operation.

## Later deployment verification

The [first automated production deployment](https://github.com/QFREEE/spacecaveman/actions/runs/39596511494)
on October 21, 2026 passed HTTPS checks for the homepage and `/api/visits` using
ordinary resolution. The [deployment guide](deployment.md) describes ongoing
releases. The DNSSEC and resolver details below record observations during the
earlier cutover; that deployment check did not re-audit DNSSEC management status.

## Cutover verification observations

- Cloudflare zone activation: confirmed.
- Root custom-domain attachment: confirmed.
- HTTPS certificate: active. On 2026-10-21 at 00:03 Eastern, the page and `/api/visits` both returned HTTP 200 through an authoritative Cloudflare address with certificate validation enabled. The API returned the three fictional sample visits.
- Ordinary resolution: the later post-DS verification returned HTTP 200 for the page and `/api/visits` using ordinary system DNS and certificate validation. Both Google and Cloudflare public resolvers returned Cloudflare A records.
- `www.spacecaveman.com`: not configured; this cutover targets the root hostname requested by the owner.
- DNSSEC trust chain: restored and validated by Cloudflare's public resolver (`AD=true` on the A answer). Google returned the exact matching parent DS with `AD=true`; its A answer still had `AD=false` at this check, consistent with cached unsigned delegation state. The Cloudflare management API still reported `pending`, so management-status convergence is not yet confirmed.

Cached old DNS answers may still point at the previous host. Its old root A TTL was four hours; the previous nameserver and DS TTLs were six hours. Resolver-specific cache expiration varies. Do not confuse the previous host's 404 with the deployed Worker's response.

Cloudflare signing was requested at 2026-10-21 00:28 Eastern. The owner explicitly accepted the temporary outage risk of publishing the DS before the recommended cache-expiration window and added the generated record in their own Squarespace session. The old provider's DS was not reused. The published parent DS exactly matches the values below.

Cloudflare's generated DS values (public DNS data, not a secret):

- Key tag: `2371`
- Algorithm: `13` (`ECDSAP256SHA256`)
- Digest type: `2` (`SHA-256`)
- Digest: `E5C988CB61BDF20C8746485EEFFCD5AF5D9FD5A727C144C81E51AB41C089CA89`

The zone activated at 23:57 Eastern on October 20; the observed old NS TTL was six hours. Some resolvers can still have old data during the cutover. For any future DNSSEC change, retrieve current DS values rather than treating this historical record as a permanent key reference.

## References

- [Workers Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
- [Cloudflare DNSSEC migration](https://developers.cloudflare.com/dns/dnssec/)
- [Squarespace nameserver settings](https://support.squarespace.com/hc/en-us/articles/4404183898125-Review-change-or-reset-your-domain-s-nameservers)
- [Squarespace DNSSEC settings](https://support.squarespace.com/hc/en-us/articles/31094668921229-DNSSEC-for-Squarespace-domains)
