"""Çoktan seçmeli "oyunculardan yapımı bul" turu.

`pool_graph`'ın aksine bağlanabilirlik gerekmiyor, o yüzden ona hiç
dokunmuyoruz — tüm havuzun kadrosunu önceden çekmeye zorlardı. Bunun yerine
doğrudan `media_pool` (önbellekli havuz) ve `lookups.get_media_cast`
(önbellekli, billing sırasına göre sıralı kadro) üstüne kuruluyor.
"""

import random
from dataclasses import dataclass

from . import lookups, media_pool
from .config import Settings
from .schemas import CastMember, MediaBrief

OPTION_COUNT = 4
DISTRACTOR_COUNT = OPTION_COUNT - 1

# 4 seçenekte en fazla 3 yanlış tahmin olabilir: 1 başlangıç + en fazla 3 ek
# açılış = 4 toplam. Bir 5. açılış hiçbir zaman tetiklenmez, o yüzden eşik de
# burada tutuluyor.
CAST_REVEAL_COUNT = 4

# Yetersiz fotoğraflı kadrosu olan bir yapım gelirse tekrar deneme sınırı.
MAX_PICK_ATTEMPTS = 8


@dataclass
class MCQRound:
    options: list[MediaBrief]
    answer: MediaBrief
    cast: list[CastMember]


def _photographed_cast(cast: list[CastMember]) -> list[CastMember]:
    """Billing sırası korunur — TMDb düşük billing'li oyuncularda sık sık
    profile_path döndürmüyor, bunlar ipucu olarak kullanılamaz."""
    return [member for member in cast if member.profile_path is not None]


async def pick_mcq_round(settings: Settings) -> MCQRound | None:
    pool = await media_pool.get_media_pool(settings)
    if len(pool) < OPTION_COUNT:
        return None

    tried: set[tuple[str, int]] = set()
    for _ in range(MAX_PICK_ATTEMPTS):
        candidates = [item for item in pool if (item["media_type"], item["id"]) not in tried]
        if not candidates:
            break
        item = random.choice(candidates)
        tried.add((item["media_type"], item["id"]))

        cast_response = await lookups.get_media_cast(item["media_type"], item["id"])
        photographed = _photographed_cast(cast_response.cast)
        if len(photographed) < CAST_REVEAL_COUNT:
            continue

        answer = MediaBrief(**item)
        distractor_pool = [
            other for other in pool if (other["media_type"], other["id"]) != (item["media_type"], item["id"])
        ]
        distractors = random.sample(distractor_pool, DISTRACTOR_COUNT)
        options = [answer] + [MediaBrief(**d) for d in distractors]
        random.shuffle(options)

        return MCQRound(
            options=options,
            answer=answer,
            cast=photographed[:CAST_REVEAL_COUNT],
        )

    return None
