export default function Button({ children, ...props }: any) {
  return (
    <button className="bg-uswift-purple text-white px-4 py-2 rounded shadow hover:bg-uswift-blue" {...props}>
      {children}
    </button>
  );
}
