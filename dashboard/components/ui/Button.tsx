export default function Button({ children, ...props }: any) {
  return (
    <button
      className="bg-uswift-accent text-white px-4 py-2 rounded shadow hover:brightness-90"
      {...props}
    >
      {children}
    </button>
  );
}
