import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MessageCircleIcon } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

const FloatingChat = ({ children }: Props) => {
  return (
    <div className="fixed bottom-4 right-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="rounded-full size-12">
        <MessageCircleIcon className="size-6" />
        <span className="sr-only">Abrir chat</span>
      </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[396px] max-h-[800px]">
          {children}
        </PopoverContent>
      </Popover>
    </div>
  );
};

export { FloatingChat };
