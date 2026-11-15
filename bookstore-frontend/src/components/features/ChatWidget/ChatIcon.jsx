const paths = {
  chat: 'M8 17.5 4 20v-4.25A7 7 0 0 1 3 12v-1a6.5 6.5 0 0 1 6.5-6.5h5A6.5 6.5 0 0 1 21 11a6.5 6.5 0 0 1-6.5 6.5H8ZM8 11h8M8 14h4.5',
  close: 'm6 6 12 12M18 6 6 18',
  collapse: 'm6.5 9.5 5.5 5.5 5.5-5.5',
  newChat: 'M12 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19h11a1.5 1.5 0 0 0 1.5-1.5V12m-4.5-5H21m-3.25-3.25v6.5',
  right: 'M5 12h14m-5-5 5 5-5 5',
  up: 'M12 19V5m-5 5 5-5 5 5',
};

export default function ChatIcon({ name, size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d={paths[name]} />
  </svg>;
}
