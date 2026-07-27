# KICKOFF — Claude Code Başlangıç Promptu

Klasörde `claude` başlat ve şu promptu yapıştır
(GitHub Actions otonom modunda bu prompt otomatik verilir):

---

CLAUDE.md, .specify/memory/constitution.md ve specs/001-linkbox/spec.md dosyalarını oku.

Önce CLAUDE.md'deki feature.json bootstrap komutunu çalıştır.

Sonra sırayla üç spec-kit aşamasını uygula:
1. /speckit-plan — teknik planı üret.
2. /speckit-tasks — görev listesini üret.
3. /speckit-implement — görevleri SIRAYLA uygula; her görevde `npx tsc --noEmit && npm run build` doğrulamasını geçmeden ilerleme.

Her faz bitiminde commit'le. Anayasaya aykırı hiçbir karar alma.

UI görevlerinden önce docs/design/ içeriğine (varsa gerçek Stitch ekranlarına) bak.
Tüm ekranları mobil, tablet ve masaüstünde responsive üret — bu zorunludur.

Spec'teki Clarifications maddeleri birbiriyle çelişiyorsa ana kullanım senaryosunu
bozmayanı uygula ve tercihini plan.md'de gerekçelendir.

Test altyapısı kurduysan doğrulamaya test komutunu da ekle (npm test / pytest);
kurmadıysan hiçbir dokümanda test iddiasında bulunma.

(İsteğe bağlı: spec'te açık soru kaldıysa önce /speckit-clarify; kalite için /speckit-analyze; UX kalitesi için /speckit-checklist ux.)

---

Proje: Linkbox · Stack: nextjs + kendi sunucu PostgreSQL (Prisma + Auth.js) · spec-kit v0.14.2
