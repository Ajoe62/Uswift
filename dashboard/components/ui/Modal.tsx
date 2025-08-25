export default function Modal({
  children,
  open,
}: {
  children: React.ReactNode;
  open: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 card-magic card-magic--glow">
        {children}
      </div>
    </div>
  );
}
