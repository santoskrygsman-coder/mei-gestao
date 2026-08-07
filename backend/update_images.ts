import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

const placeholderImages = [
  "https://images.unsplash.com/photo-1541560052-5e137f229371?w=500&q=80", // fone
  "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&q=80", // fone bluetooth
  "https://images.unsplash.com/photo-1601524909162-ae8725290836?w=500&q=80", // case
  "https://images.unsplash.com/photo-1588607147754-08064a3838dc?w=500&q=80", // acessório
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80", // headphone
  "https://images.unsplash.com/photo-1584006682522-dc17d6c0d06c?w=500&q=80", // carregador
  "https://images.unsplash.com/photo-1615526675159-e248c3021d3f?w=500&q=80", // ring light
  "https://images.unsplash.com/photo-1550029402-226115b7c579?w=500&q=80"  // acessório geral
];

async function main() {
  const products = await prisma.product.findMany();
  
  for (let i = 0; i < products.length; i++) {
    const randomImage = placeholderImages[i % placeholderImages.length];
    await prisma.product.update({
      where: { id: products[i].id },
      data: { imageUrl: randomImage }
    });
  }
  
  console.log(`Updated ${products.length} products with images!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
