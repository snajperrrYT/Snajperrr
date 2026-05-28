# 🚀 Konfiguracja User App - "Dodaj do Moich aplikacji"

## Co to jest User App?
**User App** to nowa funkcja Discord, która pozwala dodać bota do "Moich aplikacji" i używać go **wszędzie**:
- ✅ Na każdym serwerze (nawet bez uprawnień admina)
- ✅ W prywatnych wiadomościach (DM)
- ✅ W grupach prywatnych
- ✅ Bez konieczności dodawania bota na serwer

---

## 📋 Instrukcja konfiguracji (Discord Developer Portal)

### **KROK 1: Otwórz Discord Developer Portal**
1. Wejdź na: https://discord.com/developers/applications
2. Zaloguj się do Discord
3. Kliknij na swoją aplikację (bota)

### **KROK 2: Włącz User Install**
1. Po lewej stronie kliknij **"Installation"**
2. W sekcji **"Installation Contexts"** zaznacz:
   - ✅ **Guild Install** (instalacja na serwerze)
   - ✅ **User Install** (instalacja jako aplikacja użytkownika) ← **WAŻNE!**

### **KROK 3: Ustaw domyślne uprawnienia**

**Dla Guild Install (bot na serwerze):**
- Zaznacz uprawnienia: `Administrator` lub konkretne uprawnienia:
  - Send Messages
  - Embed Links
  - Attach Files
  - Read Message History
  - Use Slash Commands
  - Manage Messages (dla moderacji)
  - Ban Members (dla moderacji)
  - Kick Members (dla moderacji)
  - Manage Roles (dla moderacji)
  - Manage Channels (dla moderacji)

**Dla User Install (aplikacja użytkownika):**
- Zostaw domyślnie (bot będzie działał w kontekście użytkownika)

### **KROK 4: Zapisz zmiany**
1. Kliknij **"Save Changes"** na dole strony
2. ✅ Gotowe! Bot jest teraz User App

---

## 🔧 Rejestracja komend (już zrobione w kodzie!)

Bot automatycznie konfiguruje komendy:

### **Komendy dostępne WSZĘDZIE (Guild + User + DM):**
- Wszystkie gry (`/slots`, `/poker`, `/blackjack`, etc.)
- Wszystkie komendy rozrywkowe (`/meme`, `/joke`, `/cat`, etc.)
- Wszystkie komendy utility (`/ping`, `/help`, `/calc`, etc.)
- Wszystkie komendy AI (`/chat`, `/ask`, `/code`, etc.)
- Wszystkie komendy ekonomiczne (`/balance`, `/daily`, `/work`, etc.)
- Komendy społecznościowe (`/profile`, `/hug`, `/kiss`, etc.)
- Statystyki (`/userstats`)
- YouTube (`/download`)

### **Komendy TYLKO NA SERWERACH (Guild only):**
- Wszystkie komendy moderacyjne:
  - `/ban`, `/kick`, `/mute`, `/warn`, `/tempban`
  - `/lockdown`, `/unlock`, `/purge`, `/nuke`
  - `/automod`, `/filter`

---

## 🎯 Jak dodać bota jako User App?

### **METODA 1: Link autoryzacyjny**
Użyj tego linku (zamień `YOUR_CLIENT_ID` na ID swojego bota):

```
https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID
```

**Zobaczysz opcje:**
- "Dodaj do serwera" (Guild Install)
- "Dodaj do Moich aplikacji" (User Install) ← **KLIKNIJ TO!**

### **METODA 2: Bezpośrednio z Discord**
1. Otwórz Discord
2. Kliknij ikonę **+** (Dodaj serwer)
3. Wybierz **"Przeglądaj aplikacje"**
4. Wyszukaj swojego bota
5. Kliknij **"Dodaj do Moich aplikacji"**

---

## ✅ Jak sprawdzić czy działa?

### **Test 1: Na serwerze**
```
/help
```
→ Powinno działać jak zwykle

### **Test 2: W prywatnej wiadomości (DM)**
1. Otwórz prywatną wiadomość z botem
2. Wpisz `/` i zobaczysz dostępne komendy
3. Spróbuj:
```
/ping
/help
/meme
/joke
/cat
```
→ Wszystko powinno działać!

### **Test 3: Na innym serwerze**
1. Dołącz do serwera gdzie NIE MA twojego bota
2. Wpisz `/` i zobaczysz komendy (bot jest w "Moich aplikacjach")
3. Spróbuj:
```
/slots 100
/joke
/calc 2+2
```
→ Działa bez dodawania bota na serwer! 🎉

---

## 🛡️ Zabezpieczenia

✅ **Komendy moderacyjne NIE DZIAŁAJĄ w User Install**
- `/ban`, `/kick`, `/mute` etc. są dostępne TYLKO na serwerach
- To zapobiega nadużyciom

✅ **Komendy kontekstowe**
- Bot automatycznie wykrywa kontekst (Guild/DM)
- Niektóre funkcje (np. statystyki serwera) działają tylko na serwerze

---

## 🎮 Co może robić użytkownik z User App?

### **W prywatnych wiadomościach (DM):**
- ✅ Grać w gry (`/slots`, `/poker`, `/blackjack`)
- ✅ Rozmawiać z AI (`/chat`, `/ask`)
- ✅ Generować memy i żarty (`/meme`, `/joke`)
- ✅ Sprawdzać statystyki (`/balance`, `/rank`)
- ✅ Pobierać z YouTube (`/download`)
- ✅ Używać utilities (`/calc`, `/qrcode`, `/weather`)

### **Na każdym serwerze (nawet bez uprawnień):**
- ✅ Wszystkie powyższe funkcje
- ✅ Interakcje społeczne (`/hug`, `/kiss`)
- ❌ Moderacja (wymaga dodania bota tradycyjnie)

---

## 📊 Różnice: Guild Install vs User Install

| Funkcja | Guild Install | User Install |
|---------|---------------|--------------|
| Komendy moderacyjne | ✅ Tak | ❌ Nie |
| Gry i rozrywka | ✅ Tak | ✅ Tak |
| AI i utility | ✅ Tak | ✅ Tak |
| Statystyki serwera | ✅ Tak | ❌ Nie |
| DM (prywatne wiadomości) | ✅ Tak | ✅ Tak |
| Wymaga uprawnień | ✅ Tak (admin) | ❌ Nie |
| Wszystkie 155 komend | ✅ Tak | ⚠️ ~140 komend |

---

## 🚀 GOTOWE!

Po zakończeniu konfiguracji:

1. ✅ Zarejestruj komendy: `node registerCommands.js`
2. ✅ Uruchom bota: `npm start`
3. ✅ Użyj linku autoryzacyjnego lub dodaj z Discord
4. ✅ Ciesz się botem wszędzie! 🎉

---

## 🔗 Przydatne linki

- **Discord Developer Portal:** https://discord.com/developers/applications
- **Dokumentacja User Apps:** https://discord.com/developers/docs/tutorials/developing-a-user-installable-app
- **Support Discord:** https://discord.gg/discord-developers

---

**Bot gotowy jako User App!** 🚀
Możesz teraz używać 140+ komend wszędzie - na serwerach, w DM, w grupach! ✨
