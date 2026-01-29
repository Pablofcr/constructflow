import BudgetAdvancedView from '@/components/budget-advanced-view'

interface PageProps {
  params: {
    id: string
  }
}

export default async function BudgetAdvancedPage({ params }: PageProps) {
  // Buscar nome do projeto
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${params.id}`, {
    cache: 'no-store'
  })
  
  const project = await response.json()

  return (
    <BudgetAdvancedView 
      projectId={params.id}
      projectName={project.name}
    />
  )
}
