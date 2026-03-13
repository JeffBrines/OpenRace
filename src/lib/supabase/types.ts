export type Database = {
  public: {
    Tables: {
      races: {
        Row: {
          id: string
          name: string
          date: string
          type: 'enduro' | 'dh' | 'xc'
          location: string | null
          organizer_id: string
          categories: string[]
          rider_id_mode: 'name_only' | 'bib_only' | 'both'
          status: 'draft' | 'active' | 'complete'
          share_code: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['races']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['races']['Insert']>
      }
      stages: {
        Row: {
          id: string
          race_id: string
          name: string
          order: number
          distance: number | null
          elevation: number | null
          start_token: string
          finish_token: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['stages']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['stages']['Insert']>
      }
      riders: {
        Row: {
          id: string
          race_id: string
          name: string
          bib: string | null
          category: string
          age: number | null
          gender: 'male' | 'female' | 'non_binary'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['riders']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['riders']['Insert']>
      }
      time_records: {
        Row: {
          id: string
          stage_id: string
          rider_id: string | null
          timestamp: number
          type: 'start' | 'finish'
          device_id: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['time_records']['Row'], 'created_at'> & { created_at?: string }
        Update: Partial<Database['public']['Tables']['time_records']['Insert']>
      }
    }
    Views: {
      stage_results: {
        Row: {
          rider_id: string
          stage_id: string
          race_id: string
          start_time: number | null
          finish_time: number | null
          status: string
          elapsed_ms: number | null
        }
      }
      race_results: {
        Row: {
          rider_id: string
          race_id: string
          total_time_ms: number | null
          stage_results: object[]
          has_dnf: boolean
          category: string
          overall_rank: number
          category_rank: number
        }
      }
    }
    Functions: Record<string, never>
    Enums: {
      race_type: 'enduro' | 'dh' | 'xc'
      race_status: 'draft' | 'active' | 'complete'
      rider_id_mode: 'name_only' | 'bib_only' | 'both'
      gender_type: 'male' | 'female' | 'non_binary'
      time_record_type: 'start' | 'finish'
    }
  }
}
