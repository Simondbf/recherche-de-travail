# Guide de Déploiement Cloud Run (Domaines Personnalisés)

Ce guide explique comment déployer cette application sur Google Cloud Run, spécifiquement dans les régions **Belgique (europe-west1)** ou **Pays-Bas (europe-west4)** pour pouvoir utiliser un nom de domaine personnalisé.

## Pourquoi le code ne contient pas la région ?
Le code de cette application (React/Node.js) est **indépendant de l'infrastructure**. La région (Belgique, Pays-Bas, Londres, etc.) n'est pas définie dans le code source, mais est choisie au moment où vous créez le service sur Google Cloud.

## Étapes pour déployer sur Cloud Run via GitHub :

1. **Poussez votre code sur GitHub** (depuis le menu d'export d'AI Studio, voir explications dans le chat).
2. Allez sur la console **Google Cloud Platform > Cloud Run**.
3. Cliquez sur **Créer un service**.
4. Sélectionnez la première option : **Déployer en continu à partir d'un dépôt**.
5. Connectez votre compte GitHub et sélectionnez le dépôt de cette application.
6. **L'ETAPE CRUCIALE** : Dans la section "Région", déroulez la liste et sélectionnez manuellement **`europe-west1` (Belgique)** ou **`europe-west4` (Pays-Bas)**.
7. Laissez les autres paramètres par défaut (autoriser les requêtes non authentifiées) et cliquez sur **Créer**.

Google Cloud va automatiquement compiler le code et le déployer.

## Connexion de votre domaine personnalisé :
Une fois déployé :
1. Allez dans l'onglet **Mappages de domaines** (sur le menu de gauche de Cloud Run).
2. Cliquez sur **Ajouter un mappage**.
3. Sélectionnez le service que vous venez de créer (qui est bien étiqueté europe-west1 ou europe-west4).
4. Saisissez votre nom de domaine pour valider la configuration et obtenir les enregistrements DNS à ajouter chez Cloudflare ou votre registraire !
