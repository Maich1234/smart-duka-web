/**
 * Three bouncing dots while the model is thinking. A turn can take several
 * seconds when the model calls tools, so silence would read as a hang.
 */
export default function TypingIndicator() {
  return (
    <div className="mb-3 mr-auto max-w-[85%]">
      <div className="inline-flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-white border border-gray-100 px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full animate-bounce"
            style={{ backgroundColor: '#0F766E', animationDelay: `${i * 150}ms` }}
          />
        ))}
        <span className="sr-only">Dukana AI is typing</span>
      </div>
    </div>
  );
}
