import { Food } from "../../domain/types/Food";

interface FoodTableProps {
    list: Food[]
}

const FoodTable = (props: FoodTableProps) => {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-on-surface-muted text-xs uppercase tracking-wider border-b border-white/10">
                        <th className="px-4 py-3 text-left font-medium">Comida</th>
                        <th className="px-4 py-3 text-right font-medium">Gramos</th>
                    </tr>
                </thead>
                <tbody>
                    {props.list.map((food: Food) => (
                        <tr key={food.name} className="border-b border-white/10 hover:bg-white/5 transition">
                            <td className="px-4 py-3 text-white">{food.name}</td>
                            <td className="px-4 py-3 text-right text-on-surface-muted">{food.totalGrams}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default FoodTable