import ClientePerfilView from './ClientePerfilView'

export default function ClientePerfilPage({ params }: { params: { id: string } }) {
  return <ClientePerfilView id={params.id} />
}
