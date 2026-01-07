import { DisputeTable } from "@/components/disputes/dispute-table";

export default function DisputesPage() {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Disputes</h1>
            </div>
            <div className="rounded-lg border bg-card p-4 shadow-sm">
                <DisputeTable />
            </div>
        </div>
    );
}
