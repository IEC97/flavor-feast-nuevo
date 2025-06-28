import { ImageSourcePropType } from 'react-native';

export type Ingredient = {
  id?: number;
  name: string;
  quantity: number;
  unit?: string;
};

export type Step = {
  text?: string;
  description?: string;
  image?: ImageSourcePropType;
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
};

export type RootStackParamList = {
  Login: undefined;
  HomeTabs: { screen?: string } | undefined; 
  ForgotPassword: undefined;
  VerifyCode: { email: string };
  ResetPassword: { email: string };
  RecipeDetails: { recipe: Recipe; fromEdit?: boolean };
  RecipeForm: { recipe?: Recipe; isEdit?: boolean };
  RecipeSteps: { recipe: Recipe; isEdit?: boolean };
  FilterScreen: undefined;
  SortOptions: undefined;
};
