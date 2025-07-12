import { ImageSourcePropType } from 'react-native';

export type Ingredient = {
  id?: number;
  name: string;
  quantity: number;
  unit?: string;
};

export type AvailableIngredient = {
  id: number;
  name: string;
};

export type Step = {
  text?: string;
  description?: string;
  image?: ImageSourcePropType;
  imageUrl?: string;
  order?: number;
};

export type Recipe = {
  id: string;
  title: string;
  author: string;
  rating: number;
  category: string;
  description?: string;
  image: ImageSourcePropType;
  ingredients: Ingredient[];
  steps: Step[];
  createdByUser?: boolean;
  createdAt?: number;
  servings?: number;
  categoryId?: number;
  userId?: number; // ID del usuario que creó la receta
};

export type Comment = {
  id: number; // IDComentario
  description: string; // Descripcion
  approved: boolean; // Aprobacion
  userId?: number;
  username?: string;
  createdAt?: string;
  rating?: number; // Puntuacion
};

export type Rating = {
  id: number; // IDValoracion
  userId: number; // IDUsuario
  recipeId: number; // IDReceta
  commentId?: number; // IDComentario
  rating: number; // Puntuacion
  comment?: Comment;
};

export type RootStackParamList = {
  Login: undefined;
  HomeTabs: { screen?: string } | undefined; 
  RegisterInfo: undefined;
  ForgotPassword: undefined;
  VerifyCode: { email: string };
  ResetPassword: { email: string };
  RecipeDetails: { recipe: Recipe; fromEdit?: boolean };
  RecipeForm: { recipe?: Recipe; isEdit?: boolean };
  RecipeSteps: { recipe: Recipe; isEdit?: boolean };
  FilterScreen: undefined;
  SortOptions: undefined;
  AdminScreen: undefined;
};
