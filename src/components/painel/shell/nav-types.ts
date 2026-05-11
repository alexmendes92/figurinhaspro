export type NavItem = {
  href: string;
  label: string;
  exact?: boolean;
  icon: (props: { className?: string }) => React.ReactElement;
};
