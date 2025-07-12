import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";

interface ButtonSendToWhatsappProps {
  text: string;
  url: string;
}

const ButtonSendToWhatsapp = ({ text, url }: ButtonSendToWhatsappProps) => {
  return (
    <Button asChild variant="outline">
      <Link href={url} target="_blank" rel="noopener noreferrer">
        {text}
        <ExternalLink className="ml-2 size-4" />
      </Link>
    </Button>
  );
};

export { ButtonSendToWhatsapp };

