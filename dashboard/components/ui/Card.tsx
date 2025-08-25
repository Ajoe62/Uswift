export default function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white text-black rounded-lg shadow p-6 mb-4 card-magic card-magic--glow">
      {children}
    </div>
  );
}
