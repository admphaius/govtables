export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      tb_catalogo_fontes: {
        Row: {
          created_at: string
          escopo: string
          id: string
          is_ativo: boolean
          nome_completo: string
          orgao: string
          sigla: string
          site_oficial: string | null
          uf_escopo: string | null
        }
        Insert: {
          created_at?: string
          escopo: string
          id?: string
          is_ativo?: boolean
          nome_completo: string
          orgao: string
          sigla: string
          site_oficial?: string | null
          uf_escopo?: string | null
        }
        Update: {
          created_at?: string
          escopo?: string
          id?: string
          is_ativo?: boolean
          nome_completo?: string
          orgao?: string
          sigla?: string
          site_oficial?: string | null
          uf_escopo?: string | null
        }
        Relationships: []
      }
      tb_emop: {
        Row: {
          capitulo: string | null
          codigo: string
          created_at: string
          descricao: string
          descricao_longa: string | null
          embedding: string | null
          fonte_arquivo: string | null
          id: string
          is_ativo: boolean
          mes_referencia: string
          origem_legado: boolean
          preco_unitario: number
          subcapitulo: string | null
          tipo: Database["public"]["Enums"]["tipo_item"]
          unidade_medida: string
          updated_at: string
        }
        Insert: {
          capitulo?: string | null
          codigo: string
          created_at?: string
          descricao: string
          descricao_longa?: string | null
          embedding?: string | null
          fonte_arquivo?: string | null
          id?: string
          is_ativo?: boolean
          mes_referencia: string
          origem_legado?: boolean
          preco_unitario: number
          subcapitulo?: string | null
          tipo: Database["public"]["Enums"]["tipo_item"]
          unidade_medida: string
          updated_at?: string
        }
        Update: {
          capitulo?: string | null
          codigo?: string
          created_at?: string
          descricao?: string
          descricao_longa?: string | null
          embedding?: string | null
          fonte_arquivo?: string | null
          id?: string
          is_ativo?: boolean
          mes_referencia?: string
          origem_legado?: boolean
          preco_unitario?: number
          subcapitulo?: string | null
          tipo?: Database["public"]["Enums"]["tipo_item"]
          unidade_medida?: string
          updated_at?: string
        }
        Relationships: []
      }
      tb_sco: {
        Row: {
          codigo: string
          created_at: string
          descricao: string
          descricao_longa: string | null
          embedding: string | null
          fonte_arquivo: string | null
          grupo: string | null
          id: string
          is_ativo: boolean
          mes_referencia: string
          preco_unitario: number
          subgrupo: string | null
          tipo: Database["public"]["Enums"]["tipo_item"]
          unidade_medida: string
          updated_at: string
        }
        Insert: {
          codigo: string
          created_at?: string
          descricao: string
          descricao_longa?: string | null
          embedding?: string | null
          fonte_arquivo?: string | null
          grupo?: string | null
          id?: string
          is_ativo?: boolean
          mes_referencia: string
          preco_unitario: number
          subgrupo?: string | null
          tipo: Database["public"]["Enums"]["tipo_item"]
          unidade_medida: string
          updated_at?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          descricao?: string
          descricao_longa?: string | null
          embedding?: string | null
          fonte_arquivo?: string | null
          grupo?: string | null
          id?: string
          is_ativo?: boolean
          mes_referencia?: string
          preco_unitario?: number
          subgrupo?: string | null
          tipo?: Database["public"]["Enums"]["tipo_item"]
          unidade_medida?: string
          updated_at?: string
        }
        Relationships: []
      }
      tb_sicro: {
        Row: {
          codigo: string
          created_at: string
          descricao: string
          descricao_longa: string | null
          embedding: string | null
          estado_uf: string | null
          fonte_arquivo: string | null
          id: string
          is_ativo: boolean
          mes_referencia: string
          preco_unitario: number
          regiao_geografica: string | null
          segmento: string | null
          tipo: Database["public"]["Enums"]["tipo_item"]
          unidade_medida: string
          updated_at: string
        }
        Insert: {
          codigo: string
          created_at?: string
          descricao: string
          descricao_longa?: string | null
          embedding?: string | null
          estado_uf?: string | null
          fonte_arquivo?: string | null
          id?: string
          is_ativo?: boolean
          mes_referencia: string
          preco_unitario: number
          regiao_geografica?: string | null
          segmento?: string | null
          tipo: Database["public"]["Enums"]["tipo_item"]
          unidade_medida: string
          updated_at?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          descricao?: string
          descricao_longa?: string | null
          embedding?: string | null
          estado_uf?: string | null
          fonte_arquivo?: string | null
          id?: string
          is_ativo?: boolean
          mes_referencia?: string
          preco_unitario?: number
          regiao_geografica?: string | null
          segmento?: string | null
          tipo?: Database["public"]["Enums"]["tipo_item"]
          unidade_medida?: string
          updated_at?: string
        }
        Relationships: []
      }
      tb_sinapi: {
        Row: {
          classe: string | null
          codigo: string
          created_at: string
          descricao: string
          descricao_longa: string | null
          embedding: string | null
          estado_uf: string
          fonte_arquivo: string | null
          id: string
          is_ativo: boolean
          is_onerado: boolean
          mes_referencia: string
          preco_unitario: number
          tipo: Database["public"]["Enums"]["tipo_item"]
          unidade_medida: string
          updated_at: string
        }
        Insert: {
          classe?: string | null
          codigo: string
          created_at?: string
          descricao: string
          descricao_longa?: string | null
          embedding?: string | null
          estado_uf: string
          fonte_arquivo?: string | null
          id?: string
          is_ativo?: boolean
          is_onerado?: boolean
          mes_referencia: string
          preco_unitario: number
          tipo: Database["public"]["Enums"]["tipo_item"]
          unidade_medida: string
          updated_at?: string
        }
        Update: {
          classe?: string | null
          codigo?: string
          created_at?: string
          descricao?: string
          descricao_longa?: string | null
          embedding?: string | null
          estado_uf?: string
          fonte_arquivo?: string | null
          id?: string
          is_ativo?: boolean
          is_onerado?: boolean
          mes_referencia?: string
          preco_unitario?: number
          tipo?: Database["public"]["Enums"]["tipo_item"]
          unidade_medida?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      count_embeddings_pending: {
        Args: never
        Returns: {
          catalogo: string
          pendentes: number
          total: number
        }[]
      }
      search_catalog_semantic: {
        Args: {
          filter_catalogo?: string
          min_similarity?: number
          query_embedding: string
          result_limit?: number
        }
        Returns: {
          catalogo: string
          codigo: string
          descricao: string
          extra_info: Json
          id: string
          mes_referencia: string
          preco_unitario: number
          similarity: number
          unidade_medida: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      tipo_item: "insumo" | "composicao_analitica"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      tipo_item: ["insumo", "composicao_analitica"],
    },
  },
} as const
