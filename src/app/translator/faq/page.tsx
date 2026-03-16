import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const faqSections = [
  {
    title: "Mes témoignages",
    items: [
      {
        question:
          "Comment voir les témoignages qui me sont assignés ?",
        answer:
          "Rendez-vous dans l'onglet Témoignages. Vous y trouverez la liste de tous les témoignages que le pasteur vous a assignés, avec leur statut actuel (En traduction, Traduit, etc.). Cliquez sur un témoignage pour voir son contenu complet et commencer ou poursuivre la traduction.",
      },
      {
        question: "Comment traduire un témoignage ?",
        answer:
          "Ouvrez un témoignage assigné depuis l'onglet Témoignages. L'éditeur de traduction s'affiche avec le texte original à gauche et la zone de saisie à droite. Écrivez votre traduction directement dans l'éditeur. Si un fichier audio est disponible, vous pouvez l'écouter pour mieux comprendre le témoignage original.",
      },
      {
        question:
          "L'autosauvegarde fonctionne-t-elle automatiquement ?",
        answer:
          "Oui, votre traduction est sauvegardée automatiquement à intervalles réguliers pendant que vous écrivez. Vous n'avez pas besoin de cliquer sur un bouton Enregistrer. Un indicateur discret confirme chaque sauvegarde. Vous pouvez quitter la page et revenir plus tard sans perdre votre travail.",
      },
    ],
  },
  {
    title: "Plannings",
    items: [
      {
        question: "Comment voir mes plannings de lecture ?",
        answer:
          "Allez dans l'onglet Plannings pour voir la liste des plannings auxquels vous êtes assigné. Chaque planning est lié à une réunion et contient une liste ordonnée de témoignages à lire. Cliquez sur un planning pour voir les détails et préparer votre lecture.",
      },
      {
        question:
          "Comment préparer ma lecture avant la réunion ?",
        answer:
          "Ouvrez le planning concerné depuis l'onglet Plannings. Vous verrez la liste des témoignages dans l'ordre de lecture prévu, avec le contenu original et la traduction pour chacun. Relisez chaque témoignage et sa traduction pour vous familiariser avec le texte avant le jour de la réunion.",
      },
    ],
  },
  {
    title: "Mode Réunion",
    items: [
      {
        question: "Comment démarrer le Mode Réunion ?",
        answer:
          "Ouvrez le planning du jour depuis l'onglet Plannings, puis cliquez sur Démarrer la lecture. L'application passera en mode plein écran, optimisé pour la lecture sur téléphone. La barre de navigation disparaît pour maximiser l'espace de lecture.",
      },
      {
        question: "Comment naviguer pendant la lecture ?",
        answer:
          "En bas de l'écran, une barre fixe affiche le témoignage suivant et un indicateur de progression (ex: 3/7). Cliquez sur Suivant pour passer au prochain témoignage, ou sur Ignorer pour le sauter. Un menu latéral (accessible via le bouton en haut) affiche la liste complète et permet de sauter à n'importe quel témoignage.",
      },
      {
        question:
          "Que se passe-t-il si je ferme l'application en pleine lecture ?",
        answer:
          "Votre position de lecture est sauvegardée automatiquement sur votre appareil. Si vous fermez l'application ou si votre téléphone se met en veille, vous retrouverez automatiquement le témoignage en cours à la réouverture. Aucune donnée de progression n'est perdue.",
      },
      {
        question: "Comment activer le mode sombre ?",
        answer:
          "Dans l'en-tête du Mode Réunion, un bouton permet de basculer entre le mode clair et le mode sombre. Le mode sombre utilise un fond foncé pour réduire la fatigue visuelle et éviter d'éblouir dans une salle peu éclairée. Votre préférence est sauvegardée automatiquement.",
      },
    ],
  },
];

export default function TranslatorFaqPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">
          Aide et questions fréquentes
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Retrouvez ici les réponses aux questions courantes sur
          l&apos;utilisation de Suivi Témoignage.
        </p>
      </div>

      {faqSections.map((section) => (
        <section key={section.title} className="space-y-3">
          <h2 className="font-serif text-lg font-semibold">
            {section.title}
          </h2>
          <Accordion className="rounded-lg border border-border bg-card">
            {section.items.map((item, index) => (
              <AccordionItem key={index} value={`${section.title}-${index}`}>
                <AccordionTrigger className="px-4">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="px-4 text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      ))}
    </div>
  );
}
