export default function Footer() {
  return (
    <footer className="flex-shrink-0 border-t border-border px-4 md:px-6 py-2 text-center">
      <p className="text-xs text-muted-foreground font-ibm">
        Сайт разработан{" "}
        <a
          href="https://landingguru.ru"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          landingguru.ru
        </a>
      </p>
    </footer>
  );
}
