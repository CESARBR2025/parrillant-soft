export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface AperturaTurno {
  id: string;
  sucursal_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  activa: boolean;
  recurrencia: string | null;
  recurrencia_fin: string | null;
  creada_por: string | null;
  created_at: string;
}

export interface AperturaExcepcion {
  id: string;
  apertura_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  created_at: string;
}

export interface Turno {
  id: string;
  apertura_id: string | null;
  usuario_id: string;
  sucursal_id: string;
  inicio: string;
  fin: string | null;
  activo: boolean;
  reasignado_de: string | null;
  cerrado_por: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

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
          sucursal_id: string;
          tipo: Database["public"]["Enums"]["tipo_producto"];
        };
        Insert: {
          activa?: boolean;
          created_at?: string;
          descripcion?: string | null;
          id?: number;
          nombre: string;
          orden?: number;
          sucursal_id: string;
          tipo?: Database["public"]["Enums"]["tipo_producto"];
        };
        Update: {
          activa?: boolean;
          created_at?: string;
          descripcion?: string | null;
          id?: number;
          nombre?: string;
          orden?: number;
          sucursal_id?: string;
          tipo?: Database["public"]["Enums"]["tipo_producto"];
        };
        Relationships: [
          {
            foreignKeyName: "categorias_sucursal_id_fkey";
            columns: ["sucursal_id"];
            isOneToOne: false;
            referencedRelation: "sucursales";
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
          sucursal_id: string;
          updated_at: string;
          zona: string | null;
        };
        Insert: {
          capacidad?: number;
          created_at?: string;
          estado?: Database["public"]["Enums"]["estado_mesa"];
          id?: number;
          numero: number;
          sucursal_id: string;
          updated_at?: string;
          zona?: string | null;
        };
        Update: {
          capacidad?: number;
          created_at?: string;
          estado?: Database["public"]["Enums"]["estado_mesa"];
          id?: number;
          numero?: number;
          sucursal_id?: string;
          updated_at?: string;
          zona?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mesas_sucursal_id_fkey";
            columns: ["sucursal_id"];
            isOneToOne: false;
            referencedRelation: "sucursales";
            referencedColumns: ["id"];
          },
        ];
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
          sucursal_id: string;
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
          sucursal_id: string;
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
          sucursal_id?: string;
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
          {
            foreignKeyName: "ordenes_sucursal_id_fkey";
            columns: ["sucursal_id"];
            isOneToOne: false;
            referencedRelation: "sucursales";
            referencedColumns: ["id"];
          },
        ];
      };
      aperturas_turno: {
        Row: AperturaTurno;
        Insert: {
          id?: string;
          sucursal_id: string;
          fecha: string;
          hora_inicio: string;
          hora_fin: string;
          activa?: boolean;
          recurrencia?: string | null;
          recurrencia_fin?: string | null;
          creada_por?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          sucursal_id?: string;
          fecha?: string;
          hora_inicio?: string;
          hora_fin?: string;
          activa?: boolean;
          recurrencia?: string | null;
          recurrencia_fin?: string | null;
          creada_por?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "aperturas_turno_sucursal_id_fkey";
            columns: ["sucursal_id"];
            isOneToOne: false;
            referencedRelation: "sucursales";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "aperturas_turno_creada_por_fkey";
            columns: ["creada_por"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
        ];
      };
      aperturas_excepciones: {
        Row: AperturaExcepcion;
        Insert: {
          id?: string;
          apertura_id: string;
          fecha: string;
          hora_inicio: string;
          hora_fin: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          apertura_id?: string;
          fecha?: string;
          hora_inicio?: string;
          hora_fin?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "aperturas_excepciones_apertura_id_fkey";
            columns: ["apertura_id"];
            isOneToOne: false;
            referencedRelation: "aperturas_turno";
            referencedColumns: ["id"];
          },
        ];
      };
      registro_turnos_personal: {
        Row: Turno;
        Insert: {
          id?: string;
          apertura_id?: string | null;
          usuario_id: string;
          sucursal_id: string;
          inicio?: string;
          fin?: string | null;
          activo?: boolean;
          reasignado_de?: string | null;
          cerrado_por?: string | null;
          notas?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          apertura_id?: string | null;
          usuario_id?: string;
          sucursal_id?: string;
          inicio?: string;
          fin?: string | null;
          activo?: boolean;
          reasignado_de?: string | null;
          cerrado_por?: string | null;
          notas?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "turnos_apertura_id_fkey";
            columns: ["apertura_id"];
            isOneToOne: false;
            referencedRelation: "aperturas_turno";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "turnos_usuario_id_fkey";
            columns: ["usuario_id"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "turnos_sucursal_id_fkey";
            columns: ["sucursal_id"];
            isOneToOne: false;
            referencedRelation: "sucursales";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "turnos_cerrado_por_fkey";
            columns: ["cerrado_por"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
        ];
      };
      turnos: {
        Row: Turno;
        Insert: {
          id?: string;
          apertura_id?: string | null;
          usuario_id: string;
          sucursal_id: string;
          inicio?: string;
          fin?: string | null;
          activo?: boolean;
          reasignado_de?: string | null;
          cerrado_por?: string | null;
          notas?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          apertura_id?: string | null;
          usuario_id?: string;
          sucursal_id?: string;
          inicio?: string;
          fin?: string | null;
          activo?: boolean;
          reasignado_de?: string | null;
          cerrado_por?: string | null;
          notas?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "turnos_apertura_id_fkey";
            columns: ["apertura_id"];
            isOneToOne: false;
            referencedRelation: "aperturas_turno";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "turnos_usuario_id_fkey";
            columns: ["usuario_id"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "turnos_sucursal_id_fkey";
            columns: ["sucursal_id"];
            isOneToOne: false;
            referencedRelation: "sucursales";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "turnos_cerrado_por_fkey";
            columns: ["cerrado_por"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
        ];
      };
      sucursales: {
        Row: {
          id: string;
          slug: string;
          nombre: string;
          direccion: string | null;
          activa: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          nombre: string;
          direccion?: string | null;
          activa?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          nombre?: string;
          direccion?: string | null;
          activa?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      usuario_sucursales: {
        Row: {
          usuario_id: string;
          sucursal_id: string;
          created_at: string;
        };
        Insert: {
          usuario_id: string;
          sucursal_id: string;
          created_at?: string;
        };
        Update: {
          usuario_id?: string;
          sucursal_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "usuario_sucursales_usuario_id_fkey";
            columns: ["usuario_id"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "usuario_sucursales_sucursal_id_fkey";
            columns: ["sucursal_id"];
            isOneToOne: false;
            referencedRelation: "sucursales";
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
          sucursal_id: string;
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
          sucursal_id: string;
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
          sucursal_id?: string;
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
          {
            foreignKeyName: "productos_menu_sucursal_id_fkey";
            columns: ["sucursal_id"];
            isOneToOne: false;
            referencedRelation: "sucursales";
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
        | "caja"
        | "mesero"
        | "barra"
        | "cocina"
        | "gerente_sucursal"
        | "administrador";
      tipo_producto: "alimento" | "bebida" | "combo" | "postre";
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
        "caja",
        "mesero",
        "barra",
        "cocina",
        "gerente_sucursal",
        "administrador",
      ],
      tipo_producto: ["alimento", "bebida", "combo", "postre"],
    },
  },
} as const;
