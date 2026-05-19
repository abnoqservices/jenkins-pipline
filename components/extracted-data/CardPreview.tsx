interface CardPreviewProps {
    previewImage: string | null;
  }
  
  export function CardPreview({ previewImage }: CardPreviewProps) {
    if (!previewImage) return null;
  
    return (
      <div className="rounded-2xl overflow-hidden shadow-elevated border border-border/50">
        <img
          src={previewImage}
          alt="Business card preview"
          className="w-full h-auto max-h-80 object-contain bg-gradient-to-br from-muted to-muted/50"
        />
      </div>
    );
  }