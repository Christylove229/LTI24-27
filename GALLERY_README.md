# 🖼️ Galerie Multimédia LTI24-27

## Vue d'ensemble

La galerie permet aux utilisateurs de partager et découvrir des photos et vidéos de la communauté. Elle offre une interface moderne avec upload, organisation par albums, likes, commentaires et recherche avancée.

## Fonctionnalités

### 📤 **Upload d'images et vidéos**
- **Formats supportés** : JPG, PNG, GIF, WebP, MP4, MOV, AVI
- **Taille maximale** : 10MB par fichier
- **Métadonnées** : Titre, description, album, tags, visibilité publique/privée
- **Dimensions** : Automatiquement détectées pour les images

### 🏷️ **Organisation et recherche**
- **Albums personnalisables** : Regrouper les images par thèmes
- **Tags** : Mots-clés pour une recherche précise
- **Filtres** : Par album, type d'événement, semestre
- **Tri** : Plus récent, plus ancien, plus populaire
- **Recherche** : Dans les titres, descriptions et tags

### 👁️ **Affichage et navigation**
- **Vue grille** : Affichage classique en grille responsive
- **Vue mosaïque** : Layout Pinterest-style adaptatif
- **Lightbox** : Visionnage en plein écran avec détails
- **Navigation** : Boutons précédent/suivant, pagination

### ❤️ **Interaction sociale**
- **Likes** : Système de favoris avec compteur
- **Commentaires** : Discussion sous chaque image
- **Statistiques** : Nombre de likes et commentaires visibles
- **Temps réel** : Mise à jour automatique des compteurs

### 🎨 **Interface moderne**
- **Responsive** : Adapté mobile, tablette, desktop
- **Thème sombre/clair** : Support complet
- **Animations fluides** : Transitions et effets visuels
- **UX optimisée** : Drag & drop, aperçus, indicateurs de chargement

## Installation

### 1. Créer les tables dans Supabase
```sql
-- Exécuter le fichier sql/setup_gallery.sql
```

### 2. Configuration du stockage
Le bucket `gallery` est automatiquement créé avec :
- Accès public aux images
- Upload restreint aux utilisateurs authentifiés
- Limite de 10MB par fichier
- Types MIME autorisés configurés

### 3. Permissions
- ✅ **Visualisation** : Images publiques ou propres images
- ✅ **Upload** : Utilisateurs authentifiés uniquement
- ✅ **Modification** : Propriétaire uniquement
- ✅ **Suppression** : Propriétaire uniquement

## Structure de données

### Table `gallery_images`
```sql
CREATE TABLE gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text NOT NULL,           -- URL publique Supabase Storage
  thumbnail_url text,                -- Miniature (même URL pour images)
  file_name text NOT NULL,
  file_size bigint,                  -- En bytes
  mime_type text NOT NULL,           -- 'image/jpeg', 'video/mp4', etc.
  width integer,                     -- Largeur en pixels (images)
  height integer,                    -- Hauteur en pixels (images)
  album text DEFAULT 'Général',      -- Nom de l'album
  tags text[] DEFAULT '{}',          -- Array de tags
  is_public boolean DEFAULT true,    -- Visibilité
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Table `gallery_likes`
```sql
CREATE TABLE gallery_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id uuid REFERENCES gallery_images(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(image_id, user_id)          -- Un like par utilisateur par image
);
```

### Table `gallery_comments`
```sql
CREATE TABLE gallery_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id uuid REFERENCES gallery_images(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## Utilisation

### Upload d'une image

1. **Cliquer "Ajouter"** dans la galerie
2. **Sélectionner un fichier** (image ou vidéo)
3. **Remplir les métadonnées** :
   - Titre (obligatoire)
   - Album (optionnel, défaut "Général")
   - Description (optionnel)
   - Tags (séparés par virgules)
   - Visibilité publique (case cochée par défaut)
4. **Cliquer "Uploader"**

### Organisation

#### Albums
- Créer des albums personnalisés lors de l'upload
- Filtrer par album dans la liste déroulante
- Album "Général" pour les images non catégorisées

#### Tags
- Ajouter des mots-clés lors de l'upload
- Format : `vacances, amis, fête` (séparés par des virgules)
- Recherche dans tous les tags des images

### Interaction

#### Likes
- Cliquer sur le cœur pour liker/unliker
- Compteur visible sur chaque image
- Animation visuelle du bouton

#### Commentaires
- Ouvrir l'image en lightbox
- Ajouter un commentaire en bas
- Liste chronologique des commentaires
- Auteur et date visible pour chaque commentaire

## API Routes

### Images
```
GET  /gallery_images     - Liste des images (avec filtres)
POST /gallery_images     - Upload d'une nouvelle image
GET  /gallery_images/:id - Détails d'une image
PUT  /gallery_images/:id - Modification d'une image
DEL  /gallery_images/:id - Suppression d'une image
```

### Likes
```
GET  /gallery_likes?image_id=:id - Likes d'une image
POST /gallery_likes              - Ajouter un like
DEL  /gallery_likes/:id          - Supprimer un like
```

### Commentaires
```
GET  /gallery_comments?image_id=:id - Commentaires d'une image
POST /gallery_comments              - Ajouter un commentaire
PUT  /gallery_comments/:id          - Modifier un commentaire
DEL  /gallery_comments/:id          - Supprimer un commentaire
```

## Optimisations

### Performance
- **Lazy loading** des images
- **Pagination** côté client (50 images max)
- **Miniatures** automatiques
- **Compression** côté client si nécessaire

### Stockage
- **Supabase Storage** pour les fichiers
- **URLs publiques** pour accès rapide
- **Organisation** par dossier utilisateur
- **Nettoyage automatique** des fichiers supprimés

### Sécurité
- **RLS activé** sur toutes les tables
- **Vérification propriétaire** pour modifications
- **Types MIME** validés côté client et serveur
- **Taille fichiers** limitée à 10MB

## Fonctionnalités futures

- [ ] **Albums partagés** : Collaboration sur albums
- [ ] **Galerie privée** : Images personnelles non publiques
- [ ] **Filtres avancés** : Date, taille, dimensions
- [ ] **Diaporama** : Présentation automatique
- [ ] **Téléchargement** : Export d'images
- [ ] **Modération** : Signalement de contenu inapproprié
- [ ] **Analytics** : Statistiques d'engagement
- [ ] **IA** : Reconnaissance d'objets, suggestions de tags

## Dépannage

### Upload échoue
1. **Vérifier la taille** : Max 10MB
2. **Format supporté** : JPG, PNG, GIF, MP4, etc.
3. **Connexion** : Utilisateur doit être authentifié
4. **Quota Supabase** : Vérifier les limites du plan

### Images ne s'affichent pas
1. **URLs publiques** : Vérifier la configuration du bucket
2. **Permissions** : Images privées uniquement pour propriétaire
3. **Cache** : Vider le cache navigateur

### Likes/commentaires ne marchent pas
1. **Authentification** : Utilisateur connecté requis
2. **Permissions RLS** : Vérifier les politiques Supabase
3. **Connexion réseau** : Problème de connectivité

## Technologies

- **Frontend** : React + TypeScript
- **Backend** : Supabase (PostgreSQL)
- **Stockage** : Supabase Storage
- **Styling** : Tailwind CSS
- **Animations** : Framer Motion
- **Icônes** : Heroicons
- **Dates** : date-fns

## Support

Pour toute question ou problème :
1. Vérifier les logs de la console
2. Consulter les logs Supabase
3. Tester avec des données de test simples
4. Vérifier la configuration RLS et Storage
