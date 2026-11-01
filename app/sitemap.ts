import type { MetadataRoute } from 'next'

const baseUrl = 'https://phenoandco.fr'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: baseUrl, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/rdv`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/tarifs`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/location`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/notre-histoire`, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${baseUrl}/mentions-legales`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${baseUrl}/cgv-location`, changeFrequency: 'yearly', priority: 0.2 },
  ]
}
