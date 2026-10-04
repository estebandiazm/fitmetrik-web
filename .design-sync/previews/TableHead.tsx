import { Card } from '../../src/components/ui/Card';
import { Table, TableHead, TableRow, TableCell } from '../../src/components/ui/Table';

export function HeaderRow() {
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
      </Table>
    </Card>
  );
}
