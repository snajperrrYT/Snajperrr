import { ChangelogEntry } from "./types";

export const CHANGELOG_VERSION = '2.8.5';
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '2.8.5',
    date: '2026-05-28',
    title: 'Ultra Stabilność & Wydajność 3GB',
    features: [
      { type: 'new', text: 'Optymalizacja 3GB RAM – Wykorzystano pełną moc serwera dla bezbłędnego odtwarzania.' },
      { type: 'fix', text: 'Poprawa wyświetlania statusu – Naprawiono błędy synchronizacji panelu z botem.' },
      { type: 'improvement', text: 'Nowe UI Wydajności – Dodano wskaźnik zużycia RAM w czasie rzeczywistym na Dashboardzie.' },
      { type: 'improvement', text: 'TV_EMBEDDED Stable – Najstabilniejszy profil odtwarzania YouTube jako domyślny.' },
    ],
  },
  {
    version: '2.8.0',
    date: '2026-05-28',
    title: 'Globalne Ogłoszenia & Ultra Stabilność 3GB',
    features: [
      { type: 'new', text: 'Globalne Ogłoszenia – Administratorzy mogą teraz wysyłać i przeglądać historię wiadomości wysłanych do wszystkich serwerów.' },
      { type: 'fix', text: 'Stabilizacja YouTube (TV_EMBEDDED) – Naprawiono błąd "Streaming data not available" poprzez wdrożenie profilu TV.' },
      { type: 'new', text: 'Optymalizacja 3GB RAM – Wykorzystano pełną moc serwera, zwiększając buforowanie strumieni (128MB highWaterMark) dla braku przycięć.' },
      { type: 'new', text: 'Zarządzanie Voucherami – Dodano funkcję usuwania niechcianych kodów bezpośrednio z panelu admina.' },
      { type: 'improvement', text: 'Monitoring na Żywo – Ulepszony system diagnostyki i podglądu aktywnych serwerów z danymi o pamięci.' },
    ],
  },
  {
    version: '2.7.0',
    date: '2026-05-27',
    title: 'Pełna Widoczność Błędów i Powiadomienia DM',
    features: [
      { type: 'new', text: 'Wszystkie błędy systemowe (w tym unhandled rejections i uncaught exceptions) are teraz automatycznie wysyłane do administratora na DM Discord.' },
      { type: 'improvement', text: 'Usunięto filtrowanie powiadomień – każdy błąd i ostrzeżenie jest teraz widoczne dla administratora w czasie rzeczywistym.' },
      { type: 'new', text: 'Dodano sekcję "Co nowego" z historią wersji i datami aktualizacji.' },
      { type: 'improvement', text: 'Zaktualizowano system wersjonowania – wersja i data są wyświetlane w panelu.' },
    ],
  },
  {
    version: '2.6.0',
    date: '2026-06-01',
    title: 'Tryb Konserwacji i Stabilizacja',
    features: [
      { type: 'new', text: 'Maintenance Mode – dodano możliwość całkowitego zablokowania dostępu do bota przez administratorów w sytuacjach awaryjnych.' },
      { type: 'fix', text: 'Stabilizacja Audio – naprawiono błąd "Streaming data not available" poprzez wdrożenie profilu WEB_EMBEDDED.' },
      { type: 'improvement', text: 'Optymalizacja Bezpieczeństwa – ulepszone sprawdzanie uprawnień administratora przy kluczowych operacjach systemowych.' },
      { type: 'improvement', text: 'Stabilność Połączeń – zoptymalizowany timeout połączenia dla lepszej odporności na mikroprzerwy w sieci.' },
    ],
  },
  {
    version: '2.5.1',
    date: '2026-05-27',
    title: 'Optymalizacja Silnika i Diagnostyka',
    features: [
      { type: 'new', text: 'Komenda Ping – dodano nową komendę /ping pozwalającą sprawdzić opóźnienie WebSocket bota w czasie rzeczywistym.' },
      { type: 'fix', text: 'Stabilizacja Audio – rozwiązano błędy "Streaming data not available" poprzez optymalizację filtrów klienta ANDROID.' },
      { type: 'improvement', text: 'Zarządzanie Logami – zwiększono limit historii logów bota do 150 wpisów dla lepszej widoczności problemów.' },
    ],
  },
  {
    version: '2.4.0',
    date: '2026-05-06',
    features: [
      { type: 'new', text: 'Centrum Aktualizacji i Naprawy – nowy panel administratora do wymuszania aktualizacji ekstraktorów i naprawy bota.' },
      { type: 'improvement', text: 'AI Solution v2 – ulepszona analiza błędów za pomocą najnowszego modelu Gemini 3 Flash Preview.' },
      { type: 'fix', text: 'Cloud Run Fix – poprawiono mechanizm OAuth dla bezproblemowego logowania w środowisku Cloud Run.' },
      { type: 'new', text: 'Zarządzanie logami – dodano możliwość ręcznej edycji rozwiązań zaproponowanych przez AI.' },
    ],
  },
  {
    version: '1.4.0',
    date: '2026-05-05',
    features: [
      { type: 'new', text: 'Ponad 35 nowych ustawień Premium – odtwarzacz, efekty dźwięku, powiadomienia, wygląd, AI i zaawansowane.' },
      { type: 'new', text: 'Konfigurowalny equalizer z presetami: flat, bass, treble, rock, pop, jazz, klasyczna, electronic.' },
      { type: 'new', text: 'Tryb pętli (brak / jeden utwór / cała kolejka) i crossfade między utworami.' },
      { type: 'new', text: 'Autoplay po zakończeniu kolejki i opcja przetasowania (shuffle).' },
      { type: 'new', text: 'Personalne rekomendacje AI, analiza nastroju i AI Autopilot.' },
      { type: 'new', text: 'Ustawienia powiadomień: embed "Teraz gra", DM od bota, raport tygodniowy.' },
      { type: 'new', text: 'Opcje wyglądu: kolor akcentu, kompaktowy widok, animacje, duże okładki.' },
      { type: 'new', text: 'Zaawansowane: filtr treści explicit, region YouTube, Rich Presence Discord, język bota.' },
      { type: 'improvement', text: 'Ustawienia Premium zapisywane na serwerze – dostępne na każdym urządzeniu.' },
      { type: 'fix', text: 'Poprawiono obsługę wygaśnięcia Premium i synchronizację ustawień użytkownika.' },
    ],
  },
  {
    version: '1.3.0',
    date: '2026-05-05',
    features: [
      { type: 'new', text: 'Dodano przycisk "Dołącz do serwera twórcy" na pasku bocznym.' },
      { type: 'new', text: 'Dodano automatyczny changelog – będziesz informowany o nowych funkcjach.' },
      { type: 'fix', text: 'Naprawiono wyświetlanie statusu bota (Online/Offline) w panelu webowym.' },
    ],
  },
  {
    version: '1.2.0',
    date: '2026-04-20',
    features: [
      { type: 'new', text: 'System zgłaszania błędów (Bug Report) dla zalogowanych użytkowników.' },
      { type: 'new', text: 'Panel administracyjny – zarządzanie użytkownikami, voucherami i logami.' },
      { type: 'improvement', text: 'Lepsza jakość dźwięku dzięki optymalizacji extractorów.' },
    ],
  },
  {
    version: '1.1.0',
    date: '2026-03-10',
    features: [
      { type: 'new', text: 'Obsługa systemu Premium z voucherami.' },
      { type: 'new', text: 'Logowanie przez Discord OAuth2.' },
      { type: 'improvement', text: 'Drag & drop kolejki odtwarzania.' },
    ],
  },
];
