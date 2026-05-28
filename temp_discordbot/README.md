# 🤖 Mega Bot Discord - 155 Komend!

<div align="center">

![Discord Bot](https://img.shields.io/badge/Discord-Bot-7289DA?style=for-the-badge&logo=discord&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Commands](https://img.shields.io/badge/Commands-155-success?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

**Najpotężniejszy bot Discord w języku polskim z 155 komendami w 14 kategoriach!**

[Funkcje](#-funkcje) • [Instalacja](#-instalacja) • [Konfiguracja](#-konfiguracja) • [Użycie](#-użycie) • [Komendy](#-wszystkie-komendy)

</div>

---

## 🌟 Funkcje

### 📊 **155 Komend w 14 Kategoriach:**

- 🛡️ **15 komend moderacyjnych** - ban, kick, mute, warn, tempban, lockdown, nuke, purge, automod
- 🎮 **35 gier** - slots, poker, blackjack, crash, mines, lottery, wheel, bingo, trivia, hangman, i więcej!
- 💰 **18 komend ekonomicznych** - praca, kradzież, hazard, mining, fishing, bank, sklep
- 😂 **19 komend rozrywkowych** - memy, żarty, fakty, cytaty, wróżby, dad jokes, roasty
- 📊 **15 komend utility** - kalkulator, konwerter, QR code, hash, base64, morse, weather
- 🤖 **10 komend AI** - generowanie kodu, map, pluginów, historii, przepisów, chatbot
- 👥 **10 komend społecznościowych** - profile, śluby, adopcje, reputacja, achievementy, interakcje
- 📝 **13 komend misc** - AFK, suggest, giveaway, announcements, embeds, emoji tools
- 🎵 **7 komend muzycznych** - play, queue, skip, pause, volume (YouTube + Spotify)
- ⭐ **3 komendy poziomów/XP** - automatyczne nagrody za aktywność
- 📈 **3 komendy statystyk** - server stats, user stats, activity charts
- 📺 **2 komendy YouTube** - download do Google Drive, powiadomienia
- ⏰ **3 komendy przypomnień** - timery, przypomnienia
- 📊 **2 komendy ankiet** - głosowania, polls

### ✨ **Kluczowe funkcje:**

- ✅ **Slash Commands** (`/`) i **Prefix Commands** (`!`) - pełna kompatybilność
- 🚀 **User App** - "Dodaj do Moich aplikacji" - używaj wszędzie (DM, każdy serwer)!
- ✅ **System ekonomii** z wirtualną walutą i sklepem
- ✅ **System poziomów/XP** z automatycznymi nagrodami
- ✅ **Odtwarzacz muzyki** z YouTube i Spotify
- ✅ **AI Integration** (OpenAI GPT) - chatbot, generowanie kodu, map, pluginów
- ✅ **YouTube Downloads** - pobieranie filmów/muzyki na Google Drive (360p-4K)
- ✅ **Automoderacja** - filtr wulgaryzmów, anty-spam
- ✅ **Statystyki** - śledzenie aktywności użytkowników i serwera
- ✅ **Persistent Storage** - JSON-based data dla ekonomii, poziomów, statystyk
- ✅ **Tempban System** - automatyczne odbanowanie po wygaśnięciu czasu

---

## 🌟 User App - Dodaj do Moich aplikacji!

Bot obsługuje **User Install** - możesz go dodać do "Moich aplikacji" i używać **wszędzie**:
- ✅ W prywatnych wiadomościach (DM)
- ✅ Na każdym serwerze (nawet bez uprawnień)
- ✅ W grupach prywatnych
- ✅ 140+ komend dostępnych bez dodawania bota na serwer!

### **Jak dodać jako User App?**

1. **Skonfiguruj w Discord Developer Portal:**
   - Wejdź na: https://discord.com/developers/applications
   - Kliknij swoją aplikację → **Installation**
   - Zaznacz: ✅ **User Install**
   - Zapisz zmiany

2. **Dodaj do Moich aplikacji:**
   - Użyj linku: `https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID`
   - Lub wyszukaj bota w Discord i kliknij **"Dodaj do Moich aplikacji"**

3. **Gotowe!** Używaj komend wszędzie:
   ```
   /help
   /meme
   /joke
   /slots 100
   /chat co słychać?
   /download https://youtube.com/...
   ```

📖 **Szczegółowa instrukcja:** Zobacz [USER_APP_SETUP.md](USER_APP_SETUP.md)

---

## 🚀 Instalacja

### **Wymagania:**
- Node.js 16+ (zalecane: 20)
- npm lub yarn
- Konto Discord Developer
- ffmpeg (opcjonalnie - dla muzyki i YouTube)

---

### **⚡ METODA 1: Automatyczna instalacja (ZALECANE)**

Użyj skryptu instalacyjnego który automatycznie zainstaluje wszystko:

**Linux/Mac/Hosting (Pella.app, VPS):**
```bash
bash install.sh
```

**Windows:**
```batch
install.bat
```

**Skrypt automatycznie:**
- ✅ Sprawdzi Node.js i npm
- ✅ Usunie uszkodzone pakiety
- ✅ Zainstaluje wszystkie zależności
- ✅ Utworzy potrzebne foldery (data, downloads)
- ✅ Sprawdzi zmienne środowiskowe
- ✅ Wyświetli instrukcje uruchomienia

---

### **📦 METODA 2: Manualna instalacja**

### **1. Sklonuj repozytorium:**
```bash
git clone https://github.com/bbbbbbbbbc/DiscordBot.git
cd DiscordBot
```

### **2. Zainstaluj zależności:**
```bash
# Usuń stare pakiety (jeśli istnieją)
rm -rf node_modules package-lock.json

# Zainstaluj wszystko od zera
npm install
```

### **3. Zainstaluj ffmpeg (opcjonalnie - dla /play i /download):**

**Ubuntu/Debian:**
```bash
sudo apt install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Windows:** Pobierz z [ffmpeg.org](https://ffmpeg.org/download.html)

---

### **4. Konfiguracja:**
Stwórz plik `.env` (lub użyj Secrets w Replit/panelu hostingu):

```env
DISCORD_BOT_TOKEN=twoj_token_bota_discord
CLIENT_ID=application_id_bota_discord
OPENAI_API_KEY=twoj_klucz_openai (opcjonalnie)
YOUTUBE_COOKIES=youtube_cookies (opcjonalnie)
GUILD_ID=id_serwera_discord (opcjonalnie, dla 155 komend)
```

### **4. Zarejestruj slash commands:**
```bash
node registerCommands.js
```

**⚠️ WAŻNE:** Discord ma limit **100 globalnych komend**. Bot ma **155 komend**.

- **Bez GUILD_ID:** rejestruje 100 komend globalnie (55 nie będzie działać)
- **Z GUILD_ID:** rejestruje wszystkie 155 komend na Twoim serwerze ✅

### **5. Uruchom bota:**
```bash
node index.js
```

---

## ⚙️ Konfiguracja

### **Discord Bot Setup:**

1. Przejdź na [Discord Developer Portal](https://discord.com/developers/applications)
2. Kliknij **"New Application"**
3. Nadaj nazwę i kliknij **"Create"**
4. Przejdź do zakładki **"Bot"**
5. Kliknij **"Add Bot"** → **"Yes, do it!"**
6. Skopiuj **Token** (to jest `DISCORD_BOT_TOKEN`)
7. Włącz **Privileged Gateway Intents:**
   - ✅ Server Members Intent
   - ✅ Message Content Intent
8. Przejdź do **"OAuth2" → "URL Generator"**
9. Wybierz **Scopes:** `bot`, `applications.commands`
10. Wybierz **Bot Permissions:**
    - Administrator (lub szczegółowe: Manage Messages, Kick Members, Ban Members, etc.)
11. Skopiuj wygenerowany link i zaproś bota na serwer

### **CLIENT_ID:**
- W Discord Developer Portal → **General Information** → skopiuj **Application ID**

### **GUILD_ID (opcjonalnie, zalecane):**
1. W Discord: **Prawy klik na serwer** → **Kopiuj ID serwera**
2. Dodaj do `.env` lub Replit Secrets
3. Uruchom ponownie: `node registerCommands.js`
4. ✅ Wszystkie 155 komend działają natychmiast!

### **OpenAI API Key (opcjonalnie):**
- Wymagany dla komend AI (`/chat`, `/generatemap`, `/minecraftplugin`, `/code`, etc.)
- Zarejestruj się na [platform.openai.com](https://platform.openai.com)

### **YouTube Cookies (opcjonalnie):**
- Wymagane dla `/play` i `/download` (18+ filmy)
- Eksportuj cookies z YouTube używając rozszerzenia przeglądarki

### **Google Drive Integration:**
- Wymagane dla `/download`
- W Replit: automatycznie skonfigurowane przez connector
- Lokalnie: skonfiguruj Google Cloud Project i credentials

---

## 💻 Użycie

### **Podstawowe komendy:**
```
/help           - Zobacz wszystkie komendy (pagination)
/ping           - Sprawdź opóźnienie bota
/serverinfo     - Informacje o serwerze
/userinfo       - Informacje o użytkowniku
```

### **Moderacja:**
```
/ban @user      - Zbanuj użytkownika
/kick @user     - Wyrzuć użytkownika
/mute @user 60  - Wycisz na 60 minut
/warn @user     - Ostrzeż użytkownika
/tempban @user 24h - Ban czasowy (24 godziny)
```

### **Gry:**
```
/slots 100         - Zagraj w automaty (100 monet)
/poker 50          - Zagraj w pokera
/blackjack 25      - Zagraj w blackjacka
/trivia            - Quiz wiedzy
/hangman           - Wisielec
```

### **Ekonomia:**
```
/balance        - Sprawdź saldo
/daily          - Dzienna nagroda
/work           - Pracuj aby zarobić
/rob @user      - Okradnij użytkownika
/shop           - Zobacz sklep
```

### **Muzyka:**
```
/play Believer                              - Wyszukaj i odtwórz utwór
/play https://youtube.com/watch?v=...       - Odtwórz z YouTube
/play https://youtube.com/playlist?list=... - Cała playlista YouTube
/play https://open.spotify.com/playlist/... - Cała playlista Spotify
/play https://open.spotify.com/track/...    - Utwór ze Spotify
/skip                                       - Pomiń utwór
/queue                                      - Zobacz kolejkę
/volume 50                                  - Ustaw głośność na 50%
/pause                                      - Wstrzymaj
/resume                                     - Wznów
/stop                                       - Zatrzymaj i wyjdź
/join                                       - Dołącz do kanału głosowego
```

### **AI:**
```
/chat Opowiedz mi dowcip              - Rozmawiaj z AI
/generatemap platformówka             - Wygeneruj mapę do gry
/code stwórz prostą stronę HTML       - Generuj kod
/story napisz historię o kosmitach    - Generuj opowieści
```

---

## 📋 Wszystkie Komendy

<details>
<summary><b>🛡️ Moderacja (15 komend)</b></summary>

- `/ban` - Banuje użytkownika
- `/kick` - Wyrzuca użytkownika
- `/clear` - Usuwa wiadomości (1-100)
- `/mute` - Wycisz użytkownika (timeout 1-40320 minut)
- `/unmute` - Odwycisz użytkownika
- `/warn` - Ostrzeż użytkownika (zapisywane do pliku)
- `/warnings` - Zobacz ostrzeżenia użytkownika
- `/slowmode` - Ustaw tryb powolny (0-21600 sekund)
- `/tempban` - Ban czasowy (automatyczne odbanowanie)
- `/lockdown` - Zablokuj kanał
- `/unlock` - Odblokuj kanał
- `/purge` - Wyczyść wiadomości z filtrem
- `/nuke` - Zniszcz i odtwórz kanał
- `/automod` - Włącz/wyłącz automoderację
- `/filter` - Zarządzaj filtrem słów

</details>

<details>
<summary><b>🎮 Gry (35 komend)</b></summary>

**Pojedyncze:**
- `/guess` - Zgadywanka liczb
- `/dice` - Rzut kostką
- `/hangman` - Wisielec
- `/trivia` - Quiz wiedzy
- `/math` - Quiz matematyczny
- `/geography` - Quiz geograficzny
- `/imagequiz` - Quiz obrazkowy
- `/typerace` - Wyścig pisania
- `/memory` - Gra memory

**Multiplayer:**
- `/rps @user` - Kamień, papier, nożyce
- `/tictactoe @user` - Kółko i krzyżyk
- `/wordchain` - Łańcuch słów
- `/battleship @user` - Statki
- `/connect4 @user` - 4 w rzędzie
- `/chess @user` - Szachy

**Hazard/Ekonomia:**
- `/slots 100` - Automaty
- `/poker 50` - Poker
- `/blackjack 25` - Blackjack
- `/crash 100` - Crash game
- `/mines 50` - Minesweeper hazard
- `/lottery 10` - Loteria
- `/wheel 100` - Koło fortuny
- `/bingo 25` - Bingo
- `/race 50` - Wyścig koni
- `/horse 100` - Horse betting
- `/dice3 50` - Trzy kości
- `/coinflip 100` - Rzut monetą
- `/highlow 50` - Wysoka/Niska
- `/plinko 100` - Plinko
- `/keno 50` - Keno
- `/scratchcard 25` - Zdrapka
- `/roulette 100` - Ruletka
- `/war 50` - Wojna karciana
- `/baccarat 100` - Bakarat
- `/hilo 50` - Hi-Lo

**Inne:**
- `/emojiguess` - Zgadnij emoji
- `/roulette` - Rosyjska ruletka

</details>

<details>
<summary><b>💰 Ekonomia (18 komend)</b></summary>

- `/balance` - Sprawdź saldo
- `/daily` - Dzienna nagroda (500-1000 monet)
- `/work` - Pracuj aby zarobić (100-500 monet)
- `/rob @user` - Okradnij użytkownika
- `/deposit 1000` - Wpłać do banku
- `/withdraw 500` - Wypłać z banku
- `/fish` - Łów ryby (50-200 monet)
- `/hunt` - Poluj (100-300 monet)
- `/mine` - Kopaj minerały (75-250 monet)
- `/hack @user` - Zhakuj użytkownika
- `/gamble 100` - Zagraj w ruletę
- `/coinflip heads 50` - Rzut monetą
- `/race bet 100` - Wyścig (ekonomia)
- `/shop` - Sklep z przedmiotami
- `/buy fishing_rod` - Kup przedmiot
- `/inventory` - Twój ekwipunek
- `/pay @user 100` - Przekaż pieniądze
- `/leaderboard` - Ranking najbogatszych

</details>

<details>
<summary><b>😂 Rozrywka (19 komend)</b></summary>

- `/meme` - Losowy mem z Reddit
- `/cat` - Zdjęcie kota
- `/dog` - Zdjęcie psa
- `/joke` - Losowy żart
- `/fact` - Ciekawy fakt
- `/quote` - Inspirujący cytat
- `/fortune` - Wróżba z ciasteczka
- `/8ball pytanie` - Magiczna kula
- `/dadjoke` - Dad joke
- `/roast @user` - Zrób roast
- `/compliment @user` - Komplement
- `/riddle` - Zagadka
- `/wouldyourather` - Co wolisz?
- `/truth` - Prawda
- `/dare` - Wyzwanie
- `/neverhaveiever` - Nigdy nie...
- `/pickupline` - Tekst podrywowy
- `/horoscope rak` - Horoskop
- `/advice` - Rada dnia

</details>

<details>
<summary><b>📊 Utility (15 komend)</b></summary>

- `/ping` - Opóźnienie bota
- `/serverinfo` - Info o serwerze
- `/userinfo @user` - Info o użytkowniku
- `/avatar @user` - Avatar użytkownika
- `/calculate 2+2` - Kalkulator
- `/convert 100 USD PLN` - Konwerter walut
- `/qrcode tekst` - Wygeneruj QR code
- `/hash sha256 tekst` - Hash tekstu
- `/base64 encode tekst` - Kodowanie base64
- `/morse encode tekst` - Kod Morse'a
- `/binary encode tekst` - Kod binarny
- `/reverse tekst` - Odwróć tekst
- `/count tekst` - Policz znaki/słowa
- `/randomnumber 1 100` - Losowa liczba
- `/timestamp` - Obecny timestamp

</details>

<details>
<summary><b>🤖 AI (10 komend) - Wymaga OpenAI API Key</b></summary>

- `/chat Opowiedz mi dowcip` - Chatbot AI
- `/generatemap platformówka` - Generuj mapę do gry (5 typów)
- `/minecraftplugin nazwa funkcja` - Wygeneruj plugin Minecraft
- `/code stwórz stronę HTML` - Generuj kod
- `/story napisz historię o...` - Generuj opowieści
- `/poem napisz wiersz o...` - Generuj wiersze
- `/recipe pizza` - Wygeneruj przepis
- `/name startup AI` - Generuj nazwę
- `/slogan firma` - Generuj slogan
- `/email temat: spotkanie` - Generuj email

</details>

<details>
<summary><b>👥 Social (10 komend)</b></summary>

- `/profile @user` - Zobacz profil użytkownika
- `/badges` - Zobacz swoje odznaki
- `/marry @user` - Weź ślub
- `/divorce` - Rozwód
- `/adopt @user` - Adoptuj użytkownika
- `/disown @user` - Wyrzuć z rodziny
- `/hug @user` - Przytul
- `/kiss @user` - Pocałuj
- `/slap @user` - Uderz
- `/highfive @user` - Przybij piątkę

</details>

<details>
<summary><b>📝 Misc (13 komend)</b></summary>

- `/afk powód` - Ustaw status AFK
- `/suggest pomysł` - Zasugeruj coś
- `/giveaway` - Stwórz giveaway
- `/announcement` - Ogłoszenie
- `/embed` - Stwórz embed
- `/emojiinfo :emoji:` - Info o emoji
- `/poll advanced` - Zaawansowana ankieta
- `/vote advanced` - Zaawansowane głosowanie
- `/serverrules` - Zasady serwera
- `/roleinfo @role` - Info o roli
- `/channelinfo #kanał` - Info o kanale
- `/botinfo` - Info o bocie
- `/invite` - Link zaproszeniowy

</details>

<details>
<summary><b>🎵 Muzyka (8 komend)</b></summary>

- `/join` - **Dołącz do kanału głosowego** (bez odtwarzania muzyki)
- `/play https://youtube.com/...` - Odtwórz z YouTube
- `/stop` - Zatrzymaj muzykę i wyjdź z kanału
- `/skip` - Pomiń utwór
- `/queue` - Kolejka utworów
- `/pause` - Pauza
- `/resume` - Wznów odtwarzanie
- `/volume 50` - Ustaw głośność (0-100)

</details>

<details>
<summary><b>⭐ Poziomy (3 komendy)</b></summary>

- `/rank @user` - Zobacz poziom i XP
- `/levels` - Ranking poziomów serwera
- `/setxp @user 1000` - (Admin) Ustaw XP użytkownika

**Automatyczny system XP:** 15-25 XP za każdą wiadomość

</details>

<details>
<summary><b>📈 Statystyki (3 komendy)</b></summary>

- `/serverstats` - Statystyki serwera
- `/userstats @user` - Statystyki użytkownika
- `/activity` - Wykres aktywności (ostatnie 7 dni)

</details>

<details>
<summary><b>📺 YouTube (2 komendy)</b></summary>

- `/download https://youtube.com/...` - Pobierz film/muzykę z YouTube lub Spotify
  - Wspiera YouTube i Spotify
  - 📊 **Formaty:** Video (mp4) lub Audio (mp3)
  - 🎬 **Jakość wideo:** 360p, 480p, 720p HD, 1080p Full HD, 1440p 2K, 2160p 4K, Najlepsza
  - 📤 **Gdzie wysłać:**
    - ☁️ Google Drive (link do pliku) - domyślnie
    - 💬 Discord (załącznik bezpośrednio na czat, max 25MB)
    - 📤 Oba (Drive + Discord jednocześnie)
  - 📏 **Wyświetla rozmiar pliku** podczas pobierania i wysyłania
  - ✅ **Szczegółowe statusy:** pobieranie → rozmiar → wysyłanie → gotowe
- `/ytnotify kanał` - Powiadomienia o nowych filmach

</details>

<details>
<summary><b>⏰ Przypomnienia (3 komendy)</b></summary>

- `/remind 1h spotkanie` - Ustaw przypomnienie
- `/timer 5m` - Timer odliczający
- `/reminders` - Lista przypomnień

</details>

<details>
<summary><b>📊 Ankiety (2 komendy)</b></summary>

- `/poll pytanie opcja1 opcja2` - Stwórz ankietę
- `/vote pytanie` - Szybkie głosowanie tak/nie

</details>

---

## 🗂️ Struktura projektu

```
.
├── commands/               # Wszystkie komendy bota
│   ├── moderation/        # Moderacja (15)
│   ├── games/             # Gry (35)
│   ├── economy/           # Ekonomia (18)
│   ├── fun/               # Rozrywka (19)
│   ├── utility/           # Utility (15)
│   ├── ai/                # AI (10)
│   ├── social/            # Social (10)
│   ├── misc/              # Misc (13)
│   ├── music/             # Muzyka (7)
│   ├── leveling/          # Poziomy (3)
│   ├── stats/             # Statystyki (3)
│   ├── youtube/           # YouTube (2)
│   ├── reminders/         # Przypomnienia (3)
│   └── polls/             # Ankiety (2)
├── data/                  # Persistent storage (JSON)
│   ├── economy.json       # Salda użytkowników
│   ├── levels.json        # Poziomy i XP
│   ├── stats.json         # Statystyki
│   ├── tempbans.json      # Bany czasowe
│   └── social.json        # Dane społecznościowe
├── utils/                 # Narzędzia pomocnicze
│   └── googleDrive.js     # Google Drive integration
├── downloads/             # Tymczasowe pliki (gitignore)
├── index.js               # Główny plik bota
├── registerCommands.js    # Rejestracja slash commands
├── package.json           # Zależności Node.js
└── README.md             # Ten plik
```

---

## 🔧 Rozwiązywanie problemów

### **Bot nie odpowiada na komendy:**
1. Sprawdź czy bot jest online (zielony status)
2. Upewnij się że zarejestrowano slash commands: `node registerCommands.js`
3. Sprawdź czy bot ma uprawnienia: `Administrator` lub szczegółowe
4. Sprawdź czy włączono **Message Content Intent** w Developer Portal

### **Nie wszystkie komendy są widoczne:**
- Discord limit: **100 globalnych komend**
- Rozwiązanie: Użyj **GUILD_ID** aby zarejestrować wszystkie 155 komend na swoim serwerze
- Instrukcje w sekcji [Konfiguracja](#️-konfiguracja)

### **Komendy AI nie działają:**
- Wymagany `OPENAI_API_KEY` w `.env`
- Zarejestruj się na [platform.openai.com](https://platform.openai.com)
- Dodaj klucz do Secrets/Environment Variables

### **Muzyka nie działa:**
- Sprawdź czy masz zainstalowane `ffmpeg`
- Sprawdź czy bot jest w kanale głosowym
- Dla filmów 18+: dodaj `YOUTUBE_COOKIES`

### **Download nie działa:**
- Sprawdź konfigurację Google Drive (connector w Replit lub credentials lokalnie)
- Sprawdź `YOUTUBE_COOKIES` dla filmów 18+
- Upewnij się że `ffmpeg` jest zainstalowany (dla mp3)

---

## 📝 Changelog

### **v2.4.0 - Playlist Support**
- 🎵 **Obsługa playlist:** YouTube, Spotify i innych platform
- ✅ **Spotify playlists:** Pełna paginacja (nieograniczona liczba utworów)
- ✅ **YouTube playlists:** Automatyczne dodawanie wszystkich utworów
- ✅ **System kolejki:** Automatyczne odtwarzanie następnych utworów
- ✅ **Inteligentne wyszukiwanie:** Spotify tracks → YouTube streaming
- 🔧 **Bezpieczne zarządzanie:** Auto-cleanup ffmpeg procesów

### **v2.3.0 - Music System Fix**
- 🎵 **Naprawiono system muzyczny:** `/play` działa na 100%
- ✅ **Nowy silnik audio:** youtube-dl-exec + ffmpeg dla stabilnego streamingu
- ✅ **Zainstalowano @discordjs/opus:** pełna obsługa enkodowania audio Discord
- 🔧 **Dodano `/join`:** bot dołącza do kanału głosowego (156 komend)
- ✅ **Pełna funkcjonalność:** play, stop, skip, pause, resume, volume, queue

### **v2.2.0 - User App Update**
- 🚀 Dodano obsługę User Install - "Dodaj do Moich aplikacji"
- ✅ 140+ komend dostępnych w DM i wszędzie
- ✅ Inteligentne rozróżnianie kontekstu (Guild/DM)
- ✅ Komendy moderacyjne tylko na serwerach (zabezpieczenie)
- 📖 Szczegółowa instrukcja konfiguracji (USER_APP_SETUP.md)

### **v2.1.0 - Quality Update**
- ✅ Dodano wybór jakości wideo do `/download` (360p-4K)
- ✅ Skrypty instalacyjne dla zewnętrznego hostingu (install.sh, install.bat)
- ✅ Naprawiono kompatybilność z Pella.app i innymi hostingami
- ✅ Dodano script "start" do package.json
- ✅ Zaktualizowano dokumentację instalacji

### **v2.0.0 - Mega Update (155 komend)**
- ✅ Dodano 90 nowych komend (65 → 155)
- ✅ 20 nowych gier hazardowych
- ✅ 15 komend rozrywkowych
- ✅ 15 komend utility
- ✅ 10 komend społecznościowych
- ✅ 10 komend AI
- ✅ 10 komend ekonomicznych
- ✅ 5 komend moderacyjnych
- ✅ 13 komend misc
- ✅ Naprawiono Discord 100-command limit (guild registration)
- ✅ Przepisano /help z pagination
- ✅ Naprawiono wszystkie bugi (ekonomia, AI, tempban)
- ✅ Zaktualizowano dokumentację

### **v1.0.0 - Initial Release**
- ✅ 65 komend podstawowych
- ✅ System ekonomii, poziomów, statystyk
- ✅ Odtwarzacz muzyki
- ✅ Podstawowe komendy AI
- ✅ YouTube download
- ✅ Automoderacja

---

## 🤝 Contributing

Chcesz pomóc w rozwoju? Wspaniale! 

1. Fork projektu
2. Stwórz branch dla swojej funkcji (`git checkout -b feature/NowaFunkcja`)
3. Commit zmian (`git commit -m 'Dodano nową funkcję'`)
4. Push do brancha (`git push origin feature/NowaFunkcja`)
5. Otwórz Pull Request

---

## 📜 Licencja

Ten projekt jest na licencji Widmokonrad License v1.0 - zobacz plik [LICENSE](LICENSE) dla szczegółów.

---

## 🙏 Podziękowania

- [Discord.js](https://discord.js.org/) - Potężna biblioteka Discord
- [OpenAI](https://openai.com/) - GPT API
- [play-dl](https://github.com/play-dl/play-dl) - YouTube streaming
- [Google Drive API](https://developers.google.com/drive) - Cloud storage
- Społeczność Discord.js za wsparcie

---

<div align="center">

**Jeśli projekt Ci się podoba, zostaw ⭐ na GitHubie!**

Made with 💙 and ☕

</div>
