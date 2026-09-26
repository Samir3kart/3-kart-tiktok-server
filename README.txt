# 3 KART — TikTok LIVE

Bu layihə 3 Kart oyununun təmiz, ayrıca versiyasıdır.

## Qaydalar
- Yalnız **Parfum** hədiyyəsi iştirakçını avtomatik oyuna daxil edir.
- Maksimum **12 iştirakçı**.
- Hər iştirakçıya avtomatik **3 gizli kart** verilir.
- Yayımçı **RAUNDU BAŞLAT** düyməsini basanda kartlar açılır.
- 3 kartın cəmi xal olur.
- Ən yüksək cəm qalibdir.
- Eyni xal olarsa ən yüksək tək kart tie-break kimi istifadə olunur.
- **YENİ RAUND** növbəti raunda keçir və siyahını təmizləyir.

## İşə salmaq
Node.js 18+:
  node server.js

Sonra:
  http://localhost:3000

## TikTok hədiyyə bağlantısı
Serverdə hazır endpoint var:
POST /api/gift
JSON:
{"username":"TikTokUser","gift":"Parfum"}

Bu endpoint TikTok/StreamToEarn kimi xarici event mənbəyindən gələn hədiyyə hadisəsini oyuna ötürmək üçün nəzərdə tutulub.

Qeyd: StreamToEarn-in açıq sənədlərində bu xüsusi web-oyun üçün birbaşa webhook/API bağlantısının hazır olub-olmadığı göstərilmir. Ona görə oyun nüvəsi xarici servisdən asılı edilməyib; connector ayrıca qoşulur.
