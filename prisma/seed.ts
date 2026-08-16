import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const permissions = [
  ["catalog:read", "catalog", "read"], ["catalog:write", "catalog", "write"],
  ["cart:write", "cart", "write"], ["order:create", "order", "create"],
  ["order:read:own", "order", "read:own"], ["order:read", "order", "read"],
  ["order:update", "order", "update"], ["inventory:read", "inventory", "read"],
  ["inventory:adjust", "inventory", "adjust"], ["review:create", "review", "create"],
  ["review:moderate", "review", "moderate"], ["customer:read", "customer", "read"],
  ["analytics:read", "analytics", "read"], ["shipment:update", "shipment", "update"],
  ["notification:read", "notification", "read"],
  ["audit:read", "audit", "read"],
  ["role:manage", "role", "manage"],
] as const;

const roles = [
  ["customer", "Customer", ["catalog:read", "cart:write", "order:create", "order:read:own", "review:create"]],
  ["support", "Customer support", ["customer:read", "order:read", "order:update", "review:moderate"]],
  ["baker", "Baker", ["catalog:read", "order:read", "order:update", "inventory:read"]],
  ["fulfillment", "Fulfillment", ["order:read", "shipment:update", "inventory:read", "inventory:adjust"]],
  ["analyst", "Analyst", ["analytics:read"]],
  ["admin", "Admin", permissions.map(([key]) => key)],
  ["owner", "Owner", permissions.map(([key]) => key)],
] as const;

const catalog = [
  { name: "Strawberry Cloud", slug: "strawberry-cloud", category: ["Birthday", "birthday"], description: "Vanilla sponge, strawberry compote, and mascarpone cream.", price: 4200, featured: true, variants: [["0.5 kg", "SC-500", 3200, 500, 16], ["1 kg", "SC-1000", 4200, 1000, 18], ["2 kg", "SC-2000", 7000, 2000, 8]] },
  { name: "Dark Cocoa Dream", slug: "dark-cocoa-dream", category: ["Chocolate", "chocolate"], description: "Deep cocoa sponge with silky ganache and sea salt.", price: 4600, featured: true, variants: [["0.5 kg", "DCD-500", 3500, 500, 11], ["1 kg", "DCD-1000", 4600, 1000, 14], ["2 kg", "DCD-2000", 7600, 2000, 6]] },
  { name: "Lemon Garden", slug: "lemon-garden", category: ["Anniversary", "anniversary"], description: "Lemon curd, tender sponge, and rosemary cream.", price: 4400, featured: true, variants: [["0.5 kg", "LG-500", 3300, 500, 9], ["1 kg", "LG-1000", 4400, 1000, 9], ["2 kg", "LG-2000", 7300, 2000, 5]] },
] as const;

async function main() {
  const permissionIds = new Map<string, string>();
  for (const [key, resource, action] of permissions) {
    const permission = await prisma.permission.upsert({
      where: { key }, update: { resource, action }, create: { key, resource, action },
    });
    permissionIds.set(key, permission.id);
  }

  for (const [key, name, grantedPermissions] of roles) {
    const role = await prisma.role.upsert({
      where: { key }, update: { name, isSystem: true }, create: { key, name, isSystem: true },
    });
    for (const permissionKey of grantedPermissions) {
      const permissionId = permissionIds.get(permissionKey);
      if (!permissionId) throw new Error(`Missing seeded permission: ${permissionKey}`);
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } }, update: {}, create: { roleId: role.id, permissionId },
      });
    }
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    if (adminPassword.length < 12) throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters.");
    const owner = await prisma.role.findUniqueOrThrow({ where: { key: "owner" } });
    const user = await prisma.user.upsert({
      where: { email: adminEmail },
      update: { name: process.env.SEED_ADMIN_NAME?.trim() || "Bite & Bloom Owner", passwordHash: await hash(adminPassword, 12), status: "ACTIVE" },
      create: { name: process.env.SEED_ADMIN_NAME?.trim() || "Bite & Bloom Owner", email: adminEmail, passwordHash: await hash(adminPassword, 12), status: "ACTIVE" },
    });
    await prisma.userRole.upsert({ where: { userId_roleId: { userId: user.id, roleId: owner.id } }, update: {}, create: { userId: user.id, roleId: owner.id } });
  }

  for (const cake of catalog) {
    const [categoryName, categorySlug] = cake.category;
    const category = await prisma.category.upsert({
      where: { slug: categorySlug }, update: { name: categoryName, isActive: true }, create: { name: categoryName, slug: categorySlug },
    });
    const record = await prisma.cake.upsert({
      where: { slug: cake.slug },
      update: { name: cake.name, shortDescription: cake.description, description: cake.description, basePrice: cake.price, status: "ACTIVE", isFeatured: cake.featured, preparationTime: 2 },
      create: { name: cake.name, slug: cake.slug, shortDescription: cake.description, description: cake.description, basePrice: cake.price, status: "ACTIVE", isFeatured: cake.featured, preparationTime: 2, categories: { create: { categoryId: category.id } } },
    });
    for (const [name, sku, price, weightGrams, quantityOnHand] of cake.variants) {
      const isAvailable = quantityOnHand > 0;
      const variant = await prisma.cakeVariant.upsert({
        where: { sku }, update: { name, price, weightGrams, isDefault: weightGrams === 1000, isActive: isAvailable },
        create: { cakeId: record.id, name, sku, price, weightGrams, isDefault: weightGrams === 1000, isActive: isAvailable },
      });
      await prisma.inventoryItem.upsert({
        where: { variantId: variant.id },
        update: { quantityOnHand, quantityReserved: 0, reorderLevel: 5, status: quantityOnHand <= 5 ? "LOW_STOCK" : "IN_STOCK" },
        create: { variantId: variant.id, quantityOnHand, reorderLevel: 5, status: quantityOnHand <= 5 ? "LOW_STOCK" : "IN_STOCK" },
      });
    }
  }

  const startsAt = new Date();
  const endsAt = new Date(startsAt);
  endsAt.setFullYear(endsAt.getFullYear() + 1);
  await prisma.coupon.upsert({
    where: { code: "SWEET10" },
    update: { discountType: "PERCENTAGE", value: 10, minimumOrder: 2000, startsAt, endsAt, isActive: true },
    create: { code: "SWEET10", description: "10% welcome discount", discountType: "PERCENTAGE", value: 10, minimumOrder: 2000, startsAt, endsAt },
  });
  console.info("Seeded roles, permissions, catalogue, inventory, and SWEET10.");
}

main().catch((error: unknown) => { console.error(error); process.exitCode = 1; })
  .finally(async () => prisma.$disconnect());
