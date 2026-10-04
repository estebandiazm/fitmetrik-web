import { Card } from '../../src/components/ui/Card';
import { Table, TableHead, TableRow, TableCell } from '../../src/components/ui/Table';

const CLIENTS = [
  { name: 'Alex Rivera', plan: 'Active', lastCheckIn: '2 days ago' },
  { name: 'Jamie Chen', plan: 'No Plan', lastCheckIn: '1 week ago' },
  { name: 'Morgan Diaz', plan: 'Active', lastCheckIn: 'Today' },
];

// Table has no background of its own — it's always composed inside Card in
// this design system (see ClientRosterTable.tsx), so the preview matches.
export function ClientRoster() {
  return (
    <Card padding="none" className="overflow-hidden">
      <Table>
        <TableHead>
          <TableRow header>
            <TableCell as="th">Name</TableCell>
            <TableCell as="th">Plan</TableCell>
            <TableCell as="th">Last check-in</TableCell>
          </TableRow>
        </TableHead>
        <tbody>
          {CLIENTS.map((c) => (
            <TableRow key={c.name}>
              <TableCell>{c.name}</TableCell>
              <TableCell>{c.plan}</TableCell>
              <TableCell>{c.lastCheckIn}</TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}
