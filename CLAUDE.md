# Linkbox

Bu repo GitHub **spec-kit** (v0.14.2) Spec-Driven Development düzenini kullanır.

- Anayasa: `.specify/memory/constitution.md` — her karar buna uymak zorundadır.
- Aktif özellik: `specs/001-linkbox/` (spec.md hazır; plan.md ve tasks.md henüz ÜRETİLMEDİ).
- **İLK İŞLEM** (feature bağlamı): `.specify/feature.json` içindeki yolu bu deponun MUTLAK yoluna güncelle:
  `printf '{"feature_directory":"%s/specs/001-linkbox"}\n' "$(pwd)" > .specify/feature.json`
- Akış SIRASI: `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`.
  Bir skill'i doğrudan çağıramıyorsan `.claude/skills/speckit-<ad>/SKILL.md` dosyasını oku ve talimatlarını aynen uygula.
- `/speckit-clarify` yalnızca spec.md'de [NEEDS CLARIFICATION] kalmışsa gerekir.
- `.specify/scripts/bash/` altındaki script'leri her zaman `bash <yol>` ile çalıştır (exec biti yok).
- Genel doğrulama komutu: `npx tsc --noEmit && npm run build` — geçmeden görev tamamlanmış sayılmaz.
- Tasarım: `docs/STITCH-PROMPT.md` token ve tipografisine sadık kal.
- TÜM ekranlar mobil, tablet ve masaüstünde responsive olmak ZORUNDADIR — bu pazarlıksız bir kuraldır.
