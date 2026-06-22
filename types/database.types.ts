export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      categorias: {
        Row: {
          activa: boolean;
          created_at: string;
          descripcion: string | null;
          id: number;
          nombre: string;
          orden: number;
        };
        Insert: {
          activa?: boolean;
          created_at?: string;
          descripcion?: string | null;
          id?: number;
          nombre: string;
          orden?: number;
        };
        Update: {
          activa?: boolean;
          created_at?: string;
          descripcion?: string | null;
          id?: number;
          nombre?: string;
          orden?: number;
        };
        Relationships: [];
      };
      detalles_orden: {
        Row: {
          cantidad: number;
          created_at: string;
          id: number;
          listo: boolean;
          notas: string | null;
          orden_id: number;
          precio_unitario: number;
          producto_id: number;
          ronda: number;
          servido: boolean;
          tipo: Database["public"]["Enums"]["tipo_producto"];
        };
        Insert: {
          cantidad?: number;
          created_at?: string;
          id?: number;
          listo?: boolean;
          notas?: string | null;
          orden_id: number;
          precio_unitario: number;
          producto_id: number;
          ronda?: number;
          servido?: boolean;
          tipo: Database["public"]["Enums"]["tipo_producto"];
        };
        Update: {
          cantidad?: number;
          created_at?: string;
          id?: number;
          listo?: boolean;
          notas?: string | null;
          orden_id?: number;
          precio_unitario?: number;
          producto_id?: number;
          ronda?: number;
          servido?: boolean;
          tipo?: Database["public"]["Enums"]["tipo_producto"];
        };
        Relationships: [
          {
            foreignKeyName: "detalles_orden_orden_id_fkey";
            columns: ["orden_id"];
            isOneToOne: false;
            referencedRelation: "ordenes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "detalles_orden_producto_id_fkey";
            columns: ["producto_id"];
            isOneToOne: false;
            referencedRelation: "productos_menu";
            referencedColumns: ["id"];
          },
        ];
      };
      mesas: {
        Row: {
          capacidad: number;
          created_at: string;
          estado: Database["public"]["Enums"]["estado_mesa"];
          id: number;
          numero: number;
          updated_at: string;
          zona: string | null;
        };
        Insert: {
          capacidad?: number;
          created_at?: string;
          estado?: Database["public"]["Enums"]["estado_mesa"];
          id?: number;
          numero: number;
          updated_at?: string;
          zona?: string | null;
        };
        Update: {
          capacidad?: number;
          created_at?: string;
          estado?: Database["public"]["Enums"]["estado_mesa"];
          id?: number;
          numero?: number;
          updated_at?: string;
          zona?: string | null;
        };
        Relationships: [];
      };
      ordenes: {
        Row: {
          alimentos_servidos: boolean;
          bebidas_servidos: boolean;
          cerrado_por_id: string | null;
          comensales: number | null;
          created_at: string;
          estado: Database["public"]["Enums"]["estado_orden"];
          id: number;
          mesa_id: number;
          mesero_id: string;
          metodo_pago: string | null;
          notas: string | null;
          orden_padre_id: number | null;
          pagado_con: number | null;
          total: number | null;
          updated_at: string;
        };
        Insert: {
          alimentos_servidos?: boolean;
          bebidas_servidos?: boolean;
          cerrado_por_id?: string | null;
          comensales?: number | null;
          created_at?: string;
          estado?: Database["public"]["Enums"]["estado_orden"];
          id?: number;
          mesa_id: number;
          mesero_id: string;
          metodo_pago?: string | null;
          notas?: string | null;
          orden_padre_id?: number | null;
          pagado_con?: number | null;
          total?: number | null;
          updated_at?: string;
        };
        Update: {
          alimentos_servidos?: boolean;
          bebidas_servidos?: boolean;
          cerrado_por_id?: string | null;
          comensales?: number | null;
          created_at?: string;
          estado?: Database["public"]["Enums"]["estado_orden"];
          id?: number;
          mesa_id?: number;
          mesero_id?: string;
          metodo_pago?: string | null;
          notas?: string | null;
          orden_padre_id?: number | null;
          pagado_con?: number | null;
          total?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ordenes_cerrado_por_id_fkey";
            columns: ["cerrado_por_id"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ordenes_mesa_id_fkey";
            columns: ["mesa_id"];
            isOneToOne: false;
            referencedRelation: "mesas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ordenes_mesero_id_fkey";
            columns: ["mesero_id"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ordenes_orden_padre_id_fkey";
            columns: ["orden_padre_id"];
            isOneToOne: false;
            referencedRelation: "ordenes";
            referencedColumns: ["id"];
          },
        ];
      };
      perfiles: {
        Row: {
          activo: boolean;
          apellido: string | null;
          created_at: string;
          id: string;
          nombre: string;
          rol: Database["public"]["Enums"]["rol_usuario"];
          updated_at: string;
        };
        Insert: {
          activo?: boolean;
          apellido?: string | null;
          created_at?: string;
          id: string;
          nombre: string;
          rol?: Database["public"]["Enums"]["rol_usuario"];
          updated_at?: string;
        };
        Update: {
          activo?: boolean;
          apellido?: string | null;
          created_at?: string;
          id?: string;
          nombre?: string;
          rol?: Database["public"]["Enums"]["rol_usuario"];
          updated_at?: string;
        };
        Relationships: [];
      };
      productos_menu: {
        Row: {
          categoria_id: number;
          created_at: string;
          descripcion: string | null;
          disponible: boolean;
          id: number;
          imagen_url: string | null;
          nombre: string;
          precio: number;
          tipo: Database["public"]["Enums"]["tipo_producto"];
          updated_at: string;
        };
        Insert: {
          categoria_id: number;
          created_at?: string;
          descripcion?: string | null;
          disponible?: boolean;
          id?: number;
          imagen_url?: string | null;
          nombre: string;
          precio: number;
          tipo?: Database["public"]["Enums"]["tipo_producto"];
          updated_at?: string;
        };
        Update: {
          categoria_id?: number;
          created_at?: string;
          descripcion?: string | null;
          disponible?: boolean;
          id?: number;
          imagen_url?: string | null;
          nombre?: string;
          precio?: number;
          tipo?: Database["public"]["Enums"]["tipo_producto"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "productos_menu_categoria_id_fkey";
            columns: ["categoria_id"];
            isOneToOne: false;
            referencedRelation: "categorias";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_my_rol: {
        Args: never;
        Returns: Database["public"]["Enums"]["rol_usuario"];
      };
    };
    Enums: {
      estado_mesa: "disponible" | "ocupada" | "reservada" | "fuera_de_servicio";
      estado_orden:
        | "pendiente"
        | "en_preparacion"
        | "listo"
        | "entregado"
        | "cuenta_solicitada"
        | "cerrado"
        | "cancelado";
      rol_usuario:
        | "super_admin"
        | "admin"
        | "caja"
        | "mesero"
        | "barra"
        | "cocina";
      tipo_producto: "alimento" | "bebida" | "combo";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      estado_mesa: ["disponible", "ocupada", "reservada", "fuera_de_servicio"],
      estado_orden: [
        "pendiente",
        "en_preparacion",
        "listo",
        "entregado",
        "cuenta_solicitada",
        "cerrado",
        "cancelado",
      ],
      rol_usuario: [
        "super_admin",
        "admin",
        "caja",
        "mesero",
        "barra",
        "cocina",
      ],
      tipo_producto: ["alimento", "bebida", "combo"],
    },
  },
} as const;
