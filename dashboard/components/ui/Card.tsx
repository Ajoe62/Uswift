export default function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="card-blue-frame text-gray-900 rounded-lg p-6 mb-4">
      {children}
    </div>
  );
}
