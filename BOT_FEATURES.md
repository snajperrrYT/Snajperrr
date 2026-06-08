# Spis funkcji i komend bota — SnajperBot

Poniżej znajduje się spis funkcji i komend bota znalezionych w repozytorium. Lista może być niekompletna — jeśli chcesz pełny, dokładny spis (plik po pliku) mogę przeskanować katalog `temp_discordbot/commands` i wygenerować kompletną listę.

Repo: snajperrrYT/Snajperrr
Link do przeglądu repo (więcej wyników): https://github.com/snajperrrYT/Snajperrr/tree/cb96016d60b8d92bb945550bf24a2a73c2f00e21

---

## Krótkie podsumowanie
- Typ projektu: Discord bot (Node.js) + front-end React/TypeScript
- Liczba komend (wg README): ~155 (uwaga: Discord global limit = 100 komend)
- Główne katalogi: `temp_discordbot/` (bot, komendy), `src/` (frontend UI)

## Wymagane zmienne środowiskowe
- DISCORD_BOT_TOKEN
- CLIENT_ID
- OPENAI_API_KEY (opcjonalnie)
- YOUTUBE_API_KEY / YOUTUBE_COOKIES (opcjonalnie)
- GUILD_ID (opcjonalnie, do rejestracji wszystkich komend lokalnie)

## Jak uruchomić (skrót)
1. git clone https://github.com/snajperrrYT/Snajperrr.git
2. cd temp_discordbot
3. npm install
4. Utwórz `.env` na podstawie `.env.example`
5. Zarejestruj slash-komendy: `node registerCommands.js` (lub z GUILD_ID)
6. Uruchom: `node index.js`

---

## Kategorie komend (znalezione w kodzie / README)
Poniżej podaję zebrane z repo przykłady komend pogrupowane według kategorii. Nie wszystkie pliki mogły zostać odnalezione — lista może być uzupełniona na życzenie.

1) Gry / Rozrywka
- /slots, /poker, /blackjack, /meme, /joke, /cat

2) Utility
- /ping, /help, /calc, /userstats

3) Muzyka
- /play, /download, historia odtwarzanych utworów (UI: HistoryTab)

4) AI / Integracje
- /chat, /ask, /code (wymaga OPENAI_API_KEY)

5) Ekonomia (znalezione pliki)
- /balance, /daily, /work
- /rob (temp_discordbot/commands/economy/rob.js) — komenda do "kradzieży" gotówki (cooldown 1h)
- /hack (temp_discordbot/commands/economy/hack.js) — komenda do "zhakowania" banku (cooldown 90min)

6) Moderacja / Admin (fragmenty w src/adminCommands.ts)
- /ban, /kick, /mute, /warn, /tempban
- /lockdown, /unlock, /purge, /nuke
- /announce, /userinfo, /serverinfo
- /createvoucher (tworzenie voucherów/premii)

7) Vouchery / Premium
- createvoucher, ustawienia premium w UI (SettingsTab.tsx)

---

## Pliki i miejsca warte sprawdzenia
- `temp_discordbot/README.md` — instrukcja instalacji, konfiguracji i uwagi o rejestracji komend
- `temp_discordbot/.env.example` — przykładowe zmienne środowiskowe
- `temp_discordbot/.replit` — konfiguracja uruchomienia / deployment
- `temp_discordbot/commands/` — katalog z komendami (ekonomia, muzyka, rozrywka itp.)
- `src/` — frontend (Sidebar, HistoryTab, SettingsTab, adminCommands)

---

## Bezpieczeństwo / uwagi
- Nie dodawaj tokenów/kluczy do repo (używaj `.env` i `.gitignore`).
- Privileged Gateway Intents (Server Members, Message Content) wymagają zgody i mają implikacje prywatności.
- Komendy typu "rob" i "hack" są rozrywkowe — upewnij się, że użytkownicy rozumieją ich charakter.
- Jeśli chcesz, mogę przeskanować kod pod kątem potencjalnych wycieków sekretów lub niebezpiecznych operacji.

---

Jeśli chcesz kompletny spis (każdy plik w `temp_discordbot/commands` z nazwą komendy i krótkim opisem) wybierz jedną z opcji:
- A) Wygeneruj pełny spis komend i dodaj go do repo jako `COMMANDS.md` (zrób to teraz)
- B) Tylko wygeneruj plik lokalnie do podglądu (nie commitować)
- C) Najpierw przeskanuj repo pod kątem potencjalnych problemów bezpieczeństwa

Napisz którą opcję wybierasz.