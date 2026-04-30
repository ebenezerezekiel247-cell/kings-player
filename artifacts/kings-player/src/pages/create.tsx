import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useRef, useState } from "react";
import { useCreateListing, useGetCategories, useGetGames, getGetMyListingsQueryKey, getGetListingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Show } from "@clerk/react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ArrowLeft, Crown, Lock, ImagePlus, X, ChevronsUpDown, Check } from "lucide-react";

const createSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().min(20, "Description must be at least 20 characters"),
  price: z.coerce.number().min(0.01, "Price must be greater than 0"),
  game: z.string().min(1, "Game is required"),
  category: z.string().optional(),
  discordUsername: z.string().min(2, "Discord username is required"),
  imageUrl: z.string().optional(),
});

type CreateForm = z.infer<typeof createSchema>;

const FALLBACK_CATEGORIES = [
  { id: 1, slug: "accounts", name: "Accounts" },
  { id: 2, slug: "items", name: "Items" },
  { id: 3, slug: "currency", name: "Currency" },
  { id: 4, slug: "boosting", name: "Boosting" },
  { id: 5, slug: "power-leveling", name: "Power Leveling" },
  { id: 6, slug: "coaching", name: "Coaching" },
  { id: 7, slug: "game-coins", name: "Game Coins" },
];

const POPULAR_GAMES = [
  // PC / MMO
  "Valorant","CS2","League of Legends","Dota 2","World of Warcraft","World of Warcraft Classic",
  "Final Fantasy XIV","Diablo IV","Diablo III","Path of Exile","Path of Exile 2","Lost Ark",
  "New World: Aeternum","Elder Scrolls Online","Black Desert Online","Albion Online",
  "RuneScape","Old School RuneScape","Throne and Liberty","Lineage W","MapleStory",
  "Ragnarok Online","Guild Wars 2","Star Wars: The Old Republic","Neverwinter",
  "Blade & Soul","Aion","Perfect World","Mu Online",
  // PC / Shooter & Battle Royale
  "Fortnite","Apex Legends","PUBG: Battlegrounds","Overwatch 2","Destiny 2","Warframe",
  "Tom Clancy's Rainbow Six Siege","Hunt: Showdown 1896","Escape from Tarkov","DayZ",
  "Rust","ARK: Survival Evolved","ARK: Survival Ascended","The Division 2",
  "Borderlands 3","Helldivers 2","Arc Raiders",
  // PC / MOBA & Other
  "Heroes of the Storm","Smite 2","Predecessor","GTA V","GTA VI","Elden Ring",
  "Dark Souls III","Monster Hunter: World","Monster Hunter Wilds","Red Dead Redemption 2",
  "Cyberpunk 2077","Baldur's Gate 3","Hearthstone","Teamfight Tactics","Minecraft","Roblox",
  "Steam Account",
  // Mobile
  "PUBG Mobile","COD Mobile","Free Fire","Mobile Legends: Bang Bang","Honor of Kings",
  "Clash of Clans","Clash Royale","Brawl Stars","Genshin Impact","Honkai: Star Rail",
  "Zenless Zone Zero","Wuthering Waves","Pokémon GO","Wild Rift","Arena of Valor",
  "Diablo Immortal","Rise of Kingdoms","Lords Mobile","AFK Journey","Stumble Guys","Among Us",
  // Console
  "FIFA 25","FC 25","NBA 2K25","Madden NFL 25","Call of Duty: Warzone","Call of Duty: Black Ops 6",
  "God of War: Ragnarök","Hogwarts Legacy","Mortal Kombat 1","Street Fighter 6","Tekken 8",
  "Dragon Ball: Sparking! Zero","Xbox Game Pass Account","PlayStation Network Account",
  "Other",
];

function resizeAndEncodeImage(file: File, maxPx = 1200): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function CreateListingPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: categories } = useGetCategories();
  const { data: gamesData } = useGetGames();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [gameOpen, setGameOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const gameOptions = gamesData
    ? gamesData.map((g) => g.name)
    : POPULAR_GAMES;

  const createListing = useCreateListing({
    mutation: {
      onSuccess: (listing) => {
        queryClient.invalidateQueries({ queryKey: getGetMyListingsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetListingsQueryKey() });
        setLocation(`/listing/${listing.id}`);
      },
    },
  });

  const form = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      game: "",
      category: "",
      discordUsername: "",
      imageUrl: "",
    },
  });

  const onSubmit = (data: CreateForm) => {
    createListing.mutate({
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        game: data.game,
        category: data.category || undefined,
        discordUsername: data.discordUsername,
        imageUrl: data.imageUrl || null,
      },
    });
  };

  return (
    <Show
      when="signed-in"
      fallback={
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <Lock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Sign in to create a listing</h2>
          <p className="text-muted-foreground text-sm mb-6">You need to be signed in to sell items on Kings Player.</p>
          <Button onClick={() => setLocation("/sign-in")} data-testid="button-sign-in-create">Sign In</Button>
        </div>
      }
    >
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => setLocation("/browse")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold font-serif">Create Listing</h1>
          </div>
          <p className="text-muted-foreground text-sm">List your gaming item, account, or service for sale</p>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-card-border">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Listing Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Valorant Radiant Account - NA Server" {...field} data-testid="input-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="game"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Game</FormLabel>
                    <Popover open={gameOpen} onOpenChange={setGameOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <button
                            type="button"
                            role="combobox"
                            data-testid="select-game"
                            className={`flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${!field.value ? "text-muted-foreground" : "text-foreground"}`}
                          >
                            {field.value || "Select game"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search game..." />
                          <CommandList>
                            <CommandEmpty>No game found.</CommandEmpty>
                            <CommandGroup>
                              {gameOptions.map((g) => (
                                <CommandItem
                                  key={g}
                                  value={g}
                                  onSelect={() => {
                                    field.onChange(g);
                                    setGameOpen(false);
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${field.value === g ? "opacity-100" : "opacity-0"}`}
                                  />
                                  {g}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-2" data-testid="select-category">
                        {(categories ?? FALLBACK_CATEGORIES).map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => field.onChange(field.value === cat.slug ? "" : cat.slug)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                              field.value === cat.slug
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                            }`}
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your item in detail — rank, server, included content, delivery method..."
                        className="min-h-32 resize-none"
                        {...field}
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (USD)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-price" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discordUsername"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discord Username</FormLabel>
                      <FormControl>
                        <Input placeholder="YourName#1234" {...field} data-testid="input-discord" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Photo (optional)</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          data-testid="input-image-file"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const dataUrl = await resizeAndEncodeImage(file);
                            setImagePreview(dataUrl);
                            field.onChange(dataUrl);
                          }}
                        />
                        {imagePreview ? (
                          <div className="relative w-full rounded-xl overflow-hidden border border-border">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full max-h-56 object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setImagePreview(null);
                                field.onChange("");
                                if (fileInputRef.current) fileInputRef.current.value = "";
                              }}
                              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex flex-col items-center gap-2 py-8 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors cursor-pointer"
                          >
                            <ImagePlus className="w-7 h-7" />
                            <span className="text-sm">Click to upload a photo</span>
                            <span className="text-xs opacity-60">JPG, PNG, WEBP up to any size</span>
                          </button>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {createListing.isError && (
                <div className="text-sm text-destructive text-center space-y-1">
                  <p className="font-medium">Failed to create listing</p>
                  <p className="text-xs opacity-75 font-mono break-all">
                    {(createListing.error as any)?.message || String(createListing.error)}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={createListing.isPending}
                data-testid="button-submit-listing"
              >
                {createListing.isPending ? "Creating..." : "Create Listing"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </Show>
  );
}
