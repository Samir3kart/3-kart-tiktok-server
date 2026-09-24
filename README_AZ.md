# 3 Kart Live — TikTok Parfüm avtomatik qoşulma

Bu server TikTok LIVE-dan hədiyyə hadisələrini oxuyur və "Parfüm" göndərən şəxsi
avtomatik olaraq 12 nəfərlik gözləyən oyunçu siyahısına əlavə edir.

## Vacib
Bu hissə TikTokLive adlı qeyri-rəsmi üçüncü tərəf kitabxanasından istifadə edir.
TikTok-un öz rəsmi API-si deyil.

## Render-də qurmaq

1. Bu qovluğu ayrıca GitHub repository-yə yüklə.
2. Render -> New -> Web Service.
3. GitHub repository-ni seç.
4. Build command:
   `pip install -r requirements.txt`
5. Start command:
   `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Environment Variables:
   `TIKTOK_USERNAME` = TikTok LIVE açan hesabın username-i (məs: samir3kart)
   `GIFT_NAME` = parfüm
   `MAX_PLAYERS` = 12

## GitHub Pages saytına qoşmaq

frontend_patch.js faylındakı:
   https://YOUR-RENDER-SERVICE.onrender.com

hissəsini Render-in verdiyi URL ilə dəyiş.

Sonra bu JavaScript-i index.html-də `</body>`-dən əvvəl əlavə et.

Saytda oyunçu siyahısı üçün bu ID-lər olmalıdır:
   #waitingPlayers
   #playerCount

Əgər sənin hazır HTML-ində ID-lər fərqlidirsə, həmin iki selectoru dəyişmək lazımdır.

## İş prinsipi

TikTok LIVE -> Parfüm -> TikTokLive GiftEvent -> FastAPI -> SSE -> GitHub Pages
-> oyunçu avtomatik siyahıya düşür.

Eyni hesab bir round-da iki dəfə əlavə edilmir və limit 12 nəfərdir.
