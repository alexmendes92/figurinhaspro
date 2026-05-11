import Link from "next/link";

interface AuthFooterLinkProps {
  text: string;
  linkText: string;
  href: string;
}

export function AuthFooterLink({ text, linkText, href }: AuthFooterLinkProps) {
  return (
    <p className="text-center text-[13px] text-gray-500 mt-8">
      {text}{" "}
      <Link
        href={href}
        className="text-accent-400 hover:text-accent-300 font-semibold transition-colors"
      >
        {linkText}
      </Link>
    </p>
  );
}
