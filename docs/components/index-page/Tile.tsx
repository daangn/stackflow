export function Tile({ title, content }: { title: string; content: string }) {
  return (
    <div className="bg-neutral-100 dark:bg-neutral-900 rounded-xl p-6">
      <p className="text-gray-900 dark:text-white text-base font-bold truncate">
        {title}
      </p>
      <div className="text-[15px] text-gray-500 dark:text-gray-400 mt-1">
        {content}
      </div>
    </div>
  );
}
