# Server Action Sözleşmesi: `updateLink` genişlemesi

Bkz. `specs/001-linkbox/contracts/server-actions.md` için temel sözleşme.
Bu doküman yalnızca bu özellik kapsamındaki DEĞİŞİKLİĞİ tarif eder.

## `updateLink(input: UpdateLinkInput): Promise<ActionResult>`

**Değişen tip** (`app/actions/links.ts`):

```ts
export interface UpdateLinkInput {
  id: string;
  title?: string;
  description?: string;
  tags: string[];
  note?: string | null; // YENİ — FR-004
}
```

### Davranış

1. Mevcut oturum/env kontrolü değişmez (`requireSession`).
2. **YENİ**: `note` doğrulaması — `validateNote(input.note ?? "")`
   (`lib/validation.ts`). Boş/undefined → `null` kaydedilir. 200 karakteri
   aşarsa `{ ok: false, error: "Not 200 karakteri geçemez" }` döner ve
   HİÇBİR alan güncellenmez (title/description/tags dahil — atomik başarısızlık,
   mevcut `updateLink` fonksiyonunun ilk erken-dönüş desenine uyar).
3. `db.link.updateMany({ where: { id, userId }, data: { title, description,
   note, updatedAt: new Date() } })` — `note` diğer alanlarla AYNI çağrıda
   güncellenir (tek round-trip, D3).
4. Etiket senkronu ve `revalidatePath` davranışı DEĞİŞMEZ.

### Girdi/Çıktı Örnekleri

| Girdi (`note`) | Sonuç |
|-----------------|-------|
| `"Toplantı notları"` (18 karakter) | Kaydedilir, `ActionResult.ok = true` |
| `""` veya `undefined` | `note = NULL` kaydedilir, ikon listede gösterilmez |
| 201 karakterlik metin | `{ ok: false, error: "Not 200 karakteri geçemez" }`, kayıt DEĞİŞMEZ |

### Geriye Uyumluluk

- `note` alanı opsiyonel olduğundan, mevcut çağrılar (`{ id, title,
  description, tags }`, `note` göndermeyen) hâlâ geçerlidir ve `note`u
  `null` olarak set eder — **DİKKAT**: bu, formu note göndermeyen HERHANGİ
  bir mevcut çağrının notu sıfırlamasına yol açar. Bu yüzden
  `LinkDetailForm` (tek çağrı noktası) HER ZAMAN mevcut `note` state'ini
  gönderecek şekilde güncellenir — üçüncü bir çağrı noktası yoktur
  (`grep` ile doğrulanmıştır: `updateLink` yalnız `link-detail-form.tsx`
  içinde çağrılıyor).

## Değişmeyen: `getLink`, `listLinks` (lib/queries.ts)

`LINK_INCLUDE`/`toLinkWithTags` seçimine `note` alanı eklenir (Prisma
`select`/`include` şeması zaten tüm skaler alanları döndürür — `note` kolonu
şemaya eklendiğinde otomatik gelir; `toLinkWithTags` fonksiyonu `note:
row.note` satırıyla genişletilir).
