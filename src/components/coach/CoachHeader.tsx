import { AppHeader } from '../layout/AppHeader';
import { Input } from '../ui/Input';

interface CoachHeaderProps {
  coachName: string;
  coachEmail: string;
}

export function CoachHeader({ coachName, coachEmail }: CoachHeaderProps) {
  return (
    <AppHeader
      userName={coachName}
      userSubtitle={coachEmail}
      center={
        <div className="w-full max-w-md">
          <Input type="search" placeholder="Search clients..." className="w-full" />
        </div>
      }
    />
  );
}
