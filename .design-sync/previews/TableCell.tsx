import { Card } from '../../src/components/ui/Card';
import { Table, TableRow, TableCell } from '../../src/components/ui/Table';

export function BodyCell() {
  return (
    <Card padding="none" className="overflow-hidden">
      <Table>
        <tbody>
          <TableRow>
            <TableCell>Alex Rivera</TableCell>
          </TableRow>
        </tbody>
      </Table>
    </Card>
  );
}

export function HeaderCell() {
  return (
    <Card padding="none" className="overflow-hidden">
      <Table>
        <thead>
          <TableRow header>
            <TableCell as="th">Name</TableCell>
          </TableRow>
        </thead>
      </Table>
    </Card>
  );
}
