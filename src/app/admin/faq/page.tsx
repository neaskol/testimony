import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const faqSections = [
  {
    title: "Témoignages",
    items: [
      {
        question: "Comment ajouter un nouveau témoignage ?",
        answer:
          "Rendez-vous dans l'onglet Témoignages, puis cliquez sur le bouton Nouveau témoignage. Remplissez le formulaire avec le contenu du témoignage, sélectionnez le témoin concerné et la langue source (français ou malgache). Vous pouvez aussi ajouter un fichier audio si le témoignage a été enregistré.",
      },
      {
        question: "Comment importer un témoignage audio ?",
        answer:
          "Lors de la création ou la modification d'un témoignage, utilisez la zone d'import audio pour télécharger un fichier. Le fichier sera stocké de manière sécurisée. Si la transcription automatique est activée (Whisper), le contenu texte sera généré automatiquement à partir de l'audio.",
      },
      {
        question:
          "Que signifient les différents statuts des témoignages ?",
        answer:
          "Reçu : le témoignage vient d'être ajouté et attend un traitement. En traduction : un traducteur travaille actuellement sur la traduction. Traduit : la traduction est terminée et le témoignage est prêt à être planifié. Planifié : le témoignage a été ajouté à un planning de lecture pour une réunion. Lu : le témoignage a été lu publiquement lors d'une réunion.",
      },
      {
        question:
          "Comment filtrer et rechercher les témoignages ?",
        answer:
          "La page Témoignages dispose de filtres en haut de la liste. Vous pouvez filtrer par statut (Reçu, En traduction, Traduit, etc.), par langue source, ou effectuer une recherche textuelle par mot-clé. Les filtres se combinent pour affiner les résultats.",
      },
    ],
  },
  {
    title: "Témoins",
    items: [
      {
        question: "Comment créer une fiche témoin ?",
        answer:
          "Allez dans l'onglet Témoins et cliquez sur Nouveau témoin. Renseignez le nom complet, la ville, le téléphone (optionnel) et la langue préférée du témoin (français ou malgache). Vous pouvez aussi ajouter des notes privées visibles uniquement par vous.",
      },
      {
        question: "À quoi servent les étiquettes de couleur ?",
        answer:
          "Les étiquettes de couleur (bleu, vert, rouge, jaune, violet) permettent de classer visuellement vos témoins selon vos propres critères. Par exemple : bleu pour les nouveaux témoins, vert pour les réguliers, rouge pour un suivi particulier. L'attribution est libre et personnelle.",
      },
    ],
  },
  {
    title: "Traducteurs",
    items: [
      {
        question: "Comment inviter un traducteur ?",
        answer:
          "Rendez-vous dans l'onglet Traducteurs et cliquez sur Inviter un traducteur. Saisissez son adresse email et son nom complet. Un email d'invitation lui sera envoyé automatiquement pour qu'il puisse définir son mot de passe et accéder à l'application.",
      },
      {
        question:
          "Comment assigner un témoignage à un traducteur ?",
        answer:
          "Ouvrez le détail d'un témoignage, puis utilisez l'option d'assignation pour sélectionner un traducteur parmi ceux que vous avez invités. Le traducteur verra alors le témoignage dans sa liste de témoignages assignés et pourra commencer la traduction.",
      },
    ],
  },
  {
    title: "Réunions et plannings",
    items: [
      {
        question: "Comment créer une fiche réunion ?",
        answer:
          "Allez dans l'onglet Réunions et cliquez sur Nouvelle réunion. Renseignez la date, le titre, le sujet, l'inspiration et les écritures de référence. Cette fiche servira de base pour créer un planning de lecture associé.",
      },
      {
        question: "Comment créer un planning de lecture ?",
        answer:
          "Dans l'onglet Plannings, cliquez sur Nouveau planning. Sélectionnez la réunion concernée, puis ajoutez les témoignages dans l'ordre souhaité. Vous pourrez réordonner les témoignages par glisser-déposer pour définir l'ordre de lecture.",
      },
      {
        question:
          "Comment ordonner les témoignages dans un planning ?",
        answer:
          "Lors de la création ou modification d'un planning, les témoignages sont affichés dans une liste ordonnée. Vous pouvez les réorganiser par glisser-déposer pour définir l'ordre exact de lecture pendant la réunion.",
      },
      {
        question:
          "Comment assigner un traducteur à un planning ?",
        answer:
          "Lors de la création d'un planning, vous pouvez assigner un ou plusieurs traducteurs. Le traducteur assigné verra ce planning dans son espace et pourra préparer la lecture, puis démarrer le Mode Réunion le jour J.",
      },
    ],
  },
  {
    title: "Mode Réunion",
    items: [
      {
        question: "Comment démarrer le Mode Réunion ?",
        answer:
          "Ouvrez le planning souhaité depuis l'onglet Plannings, puis cliquez sur Démarrer la lecture. L'application passera en mode plein écran, optimisé pour la lecture sur téléphone. La barre de navigation disparaît pour maximiser l'espace de lecture.",
      },
      {
        question: "Comment naviguer pendant la lecture ?",
        answer:
          "En bas de l'écran, une barre fixe affiche le témoignage suivant et un indicateur de progression (ex: 3/7). Cliquez sur Suivant pour passer au prochain témoignage, ou sur Ignorer pour le sauter. Un menu latéral (accessible via le bouton en haut) affiche la liste complète et permet de sauter à n'importe quel témoignage.",
      },
      {
        question: "Comment activer le mode sombre ?",
        answer:
          "Dans l'en-tête du Mode Réunion, un bouton permet de basculer entre le mode clair et le mode sombre. Le mode sombre utilise un fond foncé pour réduire la fatigue visuelle et éviter d'éblouir dans une salle peu éclairée. Votre préférence est sauvegardée automatiquement.",
      },
      {
        question:
          "Quand un témoignage est-il marqué comme Lu ?",
        answer:
          "Un témoignage est marqué comme Lu uniquement lorsque vous passez au témoignage suivant en Mode Réunion actif. La simple consultation d'un témoignage en dehors du Mode Réunion (en préparation, par exemple) ne change jamais son statut. Cela garantit que seuls les témoignages réellement lus en public sont comptabilisés.",
      },
    ],
  },
];

export default function AdminFaqPage() {
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
