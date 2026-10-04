import { Card } from '../../src/components/ui/Card';
import { Table, TableRow, TableCell } from '../../src/components/ui/Table';

export function HeaderRow() {
  return (
    <Card padding="none" className="overflow-hidden">
      <Table>
        <thead>
          <TableRow header>
            <TableCell as="th">Name</TableCell>
            <TableCell as="th">Plan</TableCell>
          </TableRow>
        </thead>
      </Table>
    </Card>
  );
}

export function DataRow() {
  return (
    <Card padding="none" className="overflow-hidden">
      <Table>
        <tbody>
          <TableRow>
            <TableCell>Alex Rivera</TableCell>
            <TableCell>Active</TableCell>
          </TableRow>
        </tbody>
      </Table>
    </Card>
  );
}
