import type { Food } from "@/domain/types/Food";

interface FoodTableProps {
    list: Food[]
}

const FoodTable = (props: FoodTableProps) => {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-text-muted text-xs uppercase tracking-wider border-b border-border">
                        <th className="px-4 py-3 text-left font-medium">Comida</th>
                        <th className="px-4 py-3 text-right font-medium">Gramos</th>
                    </tr>
                </thead>
                <tbody>
                    {props.list.map((food: Food) => (
                        <tr key={food.name} className="border-b border-row-border hover:bg-row-border transition">
                            <td className="px-4 py-3 text-text-primary">{food.name}</td>
                            <td className="px-4 py-3 text-right text-text-muted">{food.totalGrams}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default FoodTable