import { ActionForm } from "@/components/action-form";
import { requireSeller } from "@/lib/auth";
import { getCategories } from "@/lib/queries";
import { createProduct } from "../../actions";

export const metadata = { title: "New listing" };

export default async function NewProduct() {
  const { store } = await requireSeller();
  const cats = await getCategories();
  return (
    <div className="container-x max-w-2xl py-4 sm:py-8">
      <h1 className="mb-1 text-2xl font-bold">New listing</h1>
      <p className="mb-6 text-sm text-ink-500">Ships from {store.city}, {store.state}.</p>
      <ActionForm action={createProduct} submit="Publish listing" className="card space-y-4 p-4 sm:p-6">
        <label className="block"><span className="label">Title</span><input name="title" placeholder="Brand, model, size/colour" className="input" required /></label>
        <label className="block"><span className="label">Category</span>
          <select name="categoryId" className="input" required>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </label>
        <label className="block"><span className="label">Description</span><textarea name="description" rows={4} className="input" required /></label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <label><span className="label">Price (₦)</span><input name="price" type="number" min={1} className="input" required /></label>
          <label><span className="label">Was (₦)</span><input name="compareAtPrice" type="number" min={1} className="input" placeholder="Optional" /></label>
          <label><span className="label">Stock</span><input name="stock" type="number" min={0} defaultValue={10} className="input" required /></label>
        </div>
        <fieldset className="rounded-xl bg-accent-400/10 p-4">
          <legend className="px-1 text-sm font-semibold text-accent-600">Team-Up price (recommended)</legend>
          <p className="mb-3 text-xs text-ink-500">Offer a lower price when several people buy together. Shoppers share it on WhatsApp for you.</p>
          <div className="grid grid-cols-2 gap-3">
            <label><span className="label">Team price (₦)</span><input name="teamPrice" type="number" min={1} className="input" /></label>
            <label><span className="label">People needed</span>
              <select name="teamSize" className="input" defaultValue="3"><option value="">None</option>{[2, 3, 4, 5, 6].map((n) => <option key={n}>{n}</option>)}</select>
            </label>
          </div>
        </fieldset>
        <label className="block"><span className="label">Image URL</span><input name="imageUrl" type="url" placeholder="https://res.cloudinary.com/…" className="input" /></label>
        <label className="block"><span className="label">Search tags (comma separated)</span><input name="tags" placeholder="phone, android, tecno" className="input" /></label>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="expressEligible" className="check" /> In stock locally and ready for same-day Express dispatch</label>
      </ActionForm>
    </div>
  );
}
