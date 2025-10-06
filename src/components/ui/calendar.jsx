import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3 w-full max-w-full overflow-hidden', className)}
      classNames={{
        months: 'flex w-full flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4 w-full',
        caption: 'flex flex-col items-center justify-center pt-2 relative w-full',
        caption_label: 'text-sm font-medium',
        nav: 'absolute top-2 left-0 right-0 flex justify-between px-2 mb-4',
        nav_button: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-gray-100 transition'
        ),
        nav_button_previous: '',
        nav_button_next: '',
        table: 'w-full border-collapse',
        head_row: 'flex w-full',
        head_cell:
          'text-muted-foreground rounded-md w-14 font-normal text-[0.8rem] text-center',
        row: 'flex w-full mt-2',
        cell: 'h-9 w-14 text-center text-sm p-0 relative overflow-hidden',
        day: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-primary/20 hover:text-primary-foreground transition'
        ),
        // **Selected day circle updated**
        day_selected:
          'bg-primary text-primary-foreground hover:bg-primary focus:bg-primary rounded-full w-8 h-8 flex items-center justify-center',
        day_today: 'bg-accent text-accent-foreground',
        day_outside: 'text-gray-400 w-9 h-9 flex items-center justify-center', 
        day_disabled: 'text-muted-foreground opacity-50',
        day_range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-5 w-5 text-gray-600" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-5 w-5 text-gray-600" />,
      }}
      {...props}
    />
  );
}

Calendar.displayName = 'Calendar';
export { Calendar };
